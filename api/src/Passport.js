import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { defaultLogger, extractUserId } from "./middleware/Logger.js";
import UserDOA from "./model/db/doa/UserDOA.js";
import { Strategy as GoogleStrategy } from "passport-google-oidc";
import { appConfig, authCookieConfig, googleAuthConfig, jwtConfig, microsoftAuthConfig, appleAuthConfig } from "./Config.js";
// import { Strategy as MicrosoftStrategy } from "passport-microsoft";
// import AppleStrategy from "passport-apple";
import CalendarProviderDOA from "./model/db/doa/CalendarProviderDOA.js";
import jwt from "jsonwebtoken";
import { AuthProviderKey, AuthProviderTypeId, CalendarProviderTypeId } from "./Constants.js";
import { generateForNewUser } from "./services/IslamicEventService.js";
import { Strategy as MagicLinkStrategy } from "passport-magic-link";
import MagicLinkTokenDOA from "./model/db/doa/MagicLinkTokenDOA.js";
import { sendMagicLinkEmail } from "./services/SmtpMailer.js";

/**
 * Issue a signed JWT for the given user. Used after email code verify and Google OAuth.
 * Payload: { sub: userId }, exp set to jwtConfig.EXPIRY_DAYS from now.
 */
export function signToken(user) {
  return jwt.sign(
    { sub: user.userId },
    jwtConfig.SECRET,
    {
      algorithm: jwtConfig.ALGORITHM,
      expiresIn: jwtConfig.EXPIRY_DAYS + "d",
    },
  );
}

/**
 * Extract JWT from the httpOnly cookie first, then fall back to Authorization: Bearer.
 * `?token=` on subscription routes is an opaque secret, not a JWT — handled separately.
 */
function jwtFromCookieOrBearerExtractor(req) {
  const fromCookie = req?.cookies?.token ?? null;
  if (fromCookie) return fromCookie;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

// JWT strategy: extract token from cookie or Authorization: Bearer, verify, load user, set req.user
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: jwtFromCookieOrBearerExtractor,
      secretOrKey: jwtConfig.SECRET,
      algorithms: [jwtConfig.ALGORITHM],
    },
    async (payload, done) => {
      try {
        const user = await UserDOA.findById(payload.sub);
        if (!user) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    },
  ),
);

/**
 * JWT auth middleware: if a valid JWT is present (httpOnly cookie or Authorization Bearer),
 * sets req.user; otherwise leaves req.user undefined. Never sends 401 (so public and
 * protected routes can share the same pipeline).
 * 
 * This method calls passport.authenticate("jwt"... which invokes the JWT strategy defined above,
 * which extracts the JWT from the cookie or Authorization: Bearer header, verifies it, loads the user, and sets req.user...
 */
export function authenticateJwt(req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    req.user = user ?? undefined;
    next();
  })(req, res, next);
}

// Configure the Google strategy for use by Passport.
// passport-openidconnect passes tokens only when the verify callback has 8+ parameters.
// With 9 params (passReqToCallback): req, issuer, profile, context, idToken, accessToken, refreshToken, params, verified
passport.use(
  new GoogleStrategy(
    {
      clientID: googleAuthConfig.CLIENT_ID,
      clientSecret: googleAuthConfig.CLIENT_SECRET,
      callbackURL: googleAuthConfig.CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, issuer, profile, context, idToken, accessToken, refreshToken, params, verified) => {
      try {
        const tokens = {
          access_token: accessToken,
          refresh_token: refreshToken || undefined,
          expires_in: params?.expires_in,
          scope: params?.scope,
        };
        const user = await findOrCreateUserFromGoogleProfile(profile, tokens);
        req.googleTokens = tokens;
        verified(null, user);
      } catch (err) {
        verified(err);
      }
    },
  ),
);

// passport.use(
//   new MicrosoftStrategy(
//     {
//       clientID: microsoftAuthConfig.CLIENT_ID,
//       clientSecret: microsoftAuthConfig.CLIENT_SECRET,
//       callbackURL: microsoftAuthConfig.CALLBACK_URL,
//       tenant: microsoftAuthConfig.TENANT,
//       scope: scopeToArray(microsoftAuthConfig.SCOPE),
//       passReqToCallback: true,
//     },
//     async (req, accessToken, refreshToken, profile, done) => {
//       try {
//         const tokens = {
//           access_token: accessToken,
//           refresh_token: refreshToken || undefined,
//           scope: microsoftAuthConfig.SCOPE,
//         };
//         const user = await findOrCreateUserFromMicrosoftProfile(profile, tokens);
//         req.microsoftTokens = tokens;
//         done(null, user);
//       } catch (err) {
//         done(err);
//       }
//     },
//   ),
// );

// passport.use(
//   new AppleStrategy(
//     {
//       clientID: appleAuthConfig.CLIENT_ID,
//       teamID: appleAuthConfig.TEAM_ID,
//       callbackURL: appleAuthConfig.CALLBACK_URL,
//       keyID: appleAuthConfig.KEY_ID,
//       privateKeyLocation: appleAuthConfig.PRIVATE_KEY_LOCATION,
//       privateKeyString: appleAuthConfig.PRIVATE_KEY,
//       passReqToCallback: true,
//       scope: scopeToArray(appleAuthConfig.SCOPE),
//     },
//     async (req, accessToken, refreshToken, idToken, profile, done) => {
//       try {
//         const tokens = {
//           access_token: accessToken,
//           refresh_token: refreshToken || undefined,
//           id_token: idToken,
//           scope: appleAuthConfig.SCOPE,
//         };
//         const user = await findOrCreateUserFromAppleProfile(
//           {
//             profile,
//             appleUserPayload: parseAppleUser(req?.body?.user),
//             decodedIdToken: typeof idToken === "string" ? jwt.decode(idToken) : null,
//           },
//           tokens,
//         );
//         req.appleTokens = tokens;
//         done(null, user);
//       } catch (err) {
//         done(err);
//       }
//     },
//   ),
// );

/**
 * GET /auth/google/login
 *
 * Redirect the user to Google for authentication.
 */
export const googleLogin = passport.authenticate("google", {
  scope: [
    "profile",
    "email",
    "https://www.googleapis.com/auth/calendar",
  ],
  accessType: "offline",
  prompt: "consent",
});

/**
 * GET /auth/google/redirect
 *
 * Handle Google OAuth2 callback, store tokens, issue JWT, and redirect to frontend with token.
 * Frontend should read token from URL (e.g. hash fragment) and store it, then send as Authorization: Bearer.
 */
const googleRedirectHandler = async (req, res) => {
  try {
    const user = req.user;
    const tokens = req.googleTokens;

    // OAuth tokens are not stored — Google is used for identity only, not API calls.
    // const expiresAt = tokens?.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;
    // if (tokens) {
    //   await UserDOA.updateUser(user.userId, {
    //     accesstoken: tokens.access_token,
    //     refreshtoken: tokens.refresh_token || null,
    //     expiresat: expiresAt,
    //     scopes: tokens.scope || null,
    //     isexpired: false,
    //   });
    // }

    const token = signToken(user);
    const frontendBase = appConfig.BASE_URL;
    res.cookie(authCookieConfig.NAME, token, authCookieConfig.OPTIONS);
    res.redirect(`${frontendBase}`);
  } catch (error) {
    defaultLogger.error("Error in Google OAuth redirect handler", {
      requestId: req?.requestId,
      userId: extractUserId(req),
      method: req?.method,
      path: req?.originalUrl?.split("?")[0] ?? req?.url,
      ip: req?.ip,
      userAgent: req?.get?.("user-agent"),
      error,
    });
    const frontendBase = appConfig.BASE_URL;
    res
      .status(500)
      .redirect(`${frontendBase}/login?error=oauth_failed`);
  }
};

export const googleRedirect = [
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  googleRedirectHandler,
];

// export const microsoftLogin = passport.authenticate("microsoft", {
//   scope: scopeToArray(microsoftAuthConfig.SCOPE),
//   prompt: "select_account",
// });

// const microsoftRedirectHandler = async (req, res) => {
//   try {
//     const token = signToken(req.user);
//     res.redirect(`${appConfig.BASE_URL}#token=${encodeURIComponent(token)}`);
//   } catch (error) {
//     defaultLogger.error("Error in Microsoft OAuth redirect handler", {
//       requestId: req?.requestId,
//       userId: extractUserId(req),
//       method: req?.method,
//       path: req?.originalUrl?.split("?")[0] ?? req?.url,
//       ip: req?.ip,
//       userAgent: req?.get?.("user-agent"),
//       error,
//     });
//     res
//       .status(500)
//       .redirect(`${appConfig.BASE_URL}/login?error=oauth_failed`);
//   }
// };

// export const microsoftRedirect = [
//   passport.authenticate("microsoft", {
//     failureRedirect: "/login",
//     session: false,
//   }),
//   microsoftRedirectHandler,
// ];

// export const appleLogin = passport.authenticate("apple", {
//   scope: scopeToArray(appleAuthConfig.SCOPE),
// });

// const appleRedirectHandler = async (req, res) => {
//   try {
//     const token = signToken(req.user);
//     res.redirect(`${appConfig.BASE_URL}#token=${encodeURIComponent(token)}`);
//   } catch (error) {
//     defaultLogger.error("Error in Apple OAuth redirect handler", {
//       requestId: req?.requestId,
//       userId: extractUserId(req),
//       method: req?.method,
//       path: req?.originalUrl?.split("?")[0] ?? req?.url,
//       ip: req?.ip,
//       userAgent: req?.get?.("user-agent"),
//       error,
//     });
//     res
//       .status(500)
//       .redirect(`${appConfig.BASE_URL}/login?error=oauth_failed`);
//   }
// };

// export const appleRedirect = [
//   passport.authenticate("apple", {
//     failureRedirect: "/login",
//     session: false,
//   }),
//   appleRedirectHandler,
// ];

/**
 * Persist token usage in DB so token one-time checks survive restarts and multi-instance deployments.
 */
class DbMagicLinkStorage {
  async set(key, value) {
    await MagicLinkTokenDOA.replaceUserTokens(String(key), value || {});
  }

  async get(key) {
    return MagicLinkTokenDOA.getUserTokens(String(key));
  }

  async delete(key) {
    return MagicLinkTokenDOA.deleteUserTokens(String(key));
  }
}

/**
 * Magic-link strategy with SMTP email integration.
 * When user requests a magic link:
 *   1. sendToken callback: generate token and email to user
 *   2. verify callback: user clicks link, token validated, user authenticated
 */
passport.use(
  new MagicLinkStrategy(
    {
      secret: jwtConfig.SECRET,
      userFields: ["email"],
      tokenField: "token",
      ttl: 600, // 10 minutes
      allowPost: true,
      passReqToCallbacks: false,
      verifyUserAfterToken: true,
      storage: new DbMagicLinkStorage(),
    },
    // sendToken callback: called when user requests magic link
    async (user, token) => {
      try {
        if (!user.email) {
          throw new Error("User email is required for magic link");
        }

        // Construct full magic-link URL
        const magicLink = `${appConfig.API_PUBLIC_URL}/api/auth/magiclink/verify?token=${encodeURIComponent(token)}`;

        await sendMagicLinkEmail({
          toEmail: user.email,
          magicLink,
        });

        defaultLogger.info("Magic link email sent", { email: user.email });
        return true;
      } catch (err) {
        defaultLogger.error("Error in sendToken callback", { error: err });
        throw err;
      }
    },
    // verify callback: called when user clicks the token link
    async (user) => {
      try {
        if (!user.email) {
          throw new Error("User email is required for authentication");
        }

        // Find or create user by email
        let dbUser = await UserDOA.getUserByEmail(user.email);

        if (!dbUser) {
          // New user: create account with EMAIL auth provider
          dbUser = await UserDOA.createUser({
            email: user.email,
            name: user.email, // Use email as fallback name
            authProviderTypeId: AuthProviderTypeId.EMAIL,
          });
          defaultLogger.info("New user created via magic link", {
            email: user.email,
            userId: dbUser.userId,
          });
        }

        // Update last login timestamp
        await UserDOA.updateLastLogin(dbUser.userId);
        defaultLogger.info("Magic link login successful", {
          email: user.email,
          userId: dbUser.userId,
        });

        return dbUser;
      } catch (err) {
        defaultLogger.error("Error in verify callback", { error: err });
        throw err;
      }
    }
  )
);

/**
 * POST /auth/magiclink/send
 * Request a magic link email.
 * Expected POST body: { email: "user@example.com" }
 */
export const magicLinkSend = [
  passport.authenticate("magiclink", {
    action: "requestToken",
    failureRedirect: "/login?error=magic_link_send_failed",
    session: false,
  }),
  (req, res, next) => {
    res.json({
      success: true,
      message: "Check your email for a magic link to sign in.",
    });
  },
];

/**
 * GET /login/check-email
 * Page informing user to check their email for the magic link
 */
export const checkEmailPage = (req, res, next) => {
  res.json({
    status: "success",
    message: "Check your email for a magic link to sign in.",
  });
};

/**
 * GET /auth/magiclink/verify
 * Verify the token from the magic link and log the user in.
 * Query param: ?token=<magic_token>
 */
export const magicLinkVerify = [
  passport.authenticate("magiclink", {
    action: "acceptToken",
    failureRedirect: "/login?error=invalid_token",
    session: false,
    userPrimaryKey: "email",
  }),
  (req, res, next) => {
    try {
      // User is authenticated; issue JWT
      const token = signToken(req.user);
      const frontendBase = appConfig.BASE_URL;

      // Redirect to frontend with token in hash
      res.redirect(
        `${frontendBase}#token=${encodeURIComponent(token)}`
      );
    } catch (err) {
      defaultLogger.error("Error in magic link verify handler", {
        error: err,
      });
      res.redirect(`${appConfig.BASE_URL}/login?error=callback_failed`);
    }
  },
];


/**
   * Find or create a user based on a Google profile.
   * Sets authProviderTypeId to GOOGLE and stores OAuth tokens in User table.
   * Optionally creates CalendarProvider for calendar integration.
   *
   * @param {Object} profile - Google user profile from OAuth (contains email, name, etc.)
   * @param {Object} tokens - OAuth tokens: { access_token, refresh_token?, expires_in, scope }
   * @returns {Promise<Object>} user object
   */
export async function findOrCreateUserFromGoogleProfile(profile, tokens = null) {
    const email =
        profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const name = profile.displayName || email;

    if (!email) {
        throw new Error("Google profile did not include an email address");
    }

    // OAuth tokens are not stored — Google is used for identity only, not API calls.
    // const expiresAt = tokens?.expires_in
    //     ? new Date(Date.now() + tokens.expires_in * 1000)
    //     : null;

    // Find or create user with Google auth provider
    let user = await UserDOA.getUserByEmail(email);

    if (!user) {
        // Create new user with Google auth
        user = await UserDOA.createUser({
            email,
            name,
            authProviderTypeId: AuthProviderTypeId.GOOGLE,
        });
        // await UserDOA.updateUser(user.userId, {
        //     accesstoken: tokens?.access_token || null,
        //     refreshtoken: tokens?.refresh_token || null,
        //     expiresat: expiresAt,
        //     scopes: tokens?.scope || null,
        //     isexpired: false,
        // });
    } else if (tokens) {
        // Update auth provider type only; tokens are not persisted.
        await UserDOA.updateUser(user.userId, {
            authprovidertypeid: AuthProviderTypeId.GOOGLE,
            // accesstoken: tokens.access_token,
            // refreshtoken: tokens.refresh_token || user.refreshToken,
            // expiresat: expiresAt,
            // scopes: tokens.scope || user.scopes,
            // isexpired: false,
        });
        // await UserDOA.updateUser(user.userId, {
        //     authprovidertypeid: AuthProviderTypeId.GOOGLE,
        //     accesstoken: tokens.access_token,
        //     refreshtoken: tokens.refresh_token || user.refreshToken,
        //     expiresat: expiresAt,
        //     scopes: tokens.scope || user.scopes,
        //     isexpired: false,
        // });
    }

    // CalendarProvider token storage disabled — no Google Calendar API calls are made.
    // let calendarProvider = await CalendarProviderDOA.findByUserAndType(
    //     user.userId,
    //     CalendarProviderTypeId.GOOGLE_CALENDAR,
    // );
    // if (!calendarProvider && tokens) {
    //     await CalendarProviderDOA.createCalendarProvider({
    //         userId: user.userId,
    //         calendarProviderTypeId: CalendarProviderTypeId.GOOGLE_CALENDAR,
    //         email,
    //         accessToken: tokens.access_token || null,
    //         refreshToken: tokens.refresh_token || null,
    //         expiresAt: expiresAt,
    //         scopes: tokens.scope || null,
    //         salt: null,
    //     });
    // } else if (calendarProvider && tokens) {
    //     await CalendarProviderDOA.updateTokens(calendarProvider.calendarProviderId, {
    //         accessToken: tokens.access_token,
    //         refreshToken: tokens.refresh_token || calendarProvider.refreshToken,
    //         expiresAt: expiresAt,
    //         scopes: tokens.scope || calendarProvider.scopes,
    //     });
    // }

    // Update last login timestamp
    await UserDOA.updateLastLogin(user.userId);

    // Refresh user from database to get latest data
    user = await UserDOA.findById(user.userId);

    // Auto-generate Islamic events for the current year if this is a new or
    // upgraded user. The upsert makes this idempotent so calling it
    // redundantly is harmless.
    // generateForNewUser(user.userId).catch(() => {});

    return user;
}

  // export async function findOrCreateUserFromMicrosoftProfile(profile, tokens = null) {
  //   const email =
  //     profile?.emails?.[0]?.value ||
  //     profile?._json?.mail ||
  //     profile?._json?.userPrincipalName ||
  //     null;
  //   const name = profile?.displayName || email;

  //   if (!email) {
  //     throw new Error("Microsoft profile did not include an email address");
  //   }

  //   let user = await UserDOA.getUserByEmail(email);

  //   if (!user) {
  //     user = await UserDOA.createUser({
  //       email,
  //       name,
  //       authProviderTypeId: AuthProviderTypeId.MICROSOFT,
  //     });
  //   }

  //   if (tokens) {
  //     await UserDOA.updateUser(user.userId, {
  //       authprovidertypeid: AuthProviderTypeId.MICROSOFT,
  //       accesstoken: tokens.access_token,
  //       refreshtoken: tokens.refresh_token || user.refreshToken,
  //       scopes: tokens.scope || user.scopes,
  //       isexpired: false,
  //     });
  //   }

  //   let calendarProvider = await CalendarProviderDOA.findByUserAndType(
  //     user.userId,
  //     CalendarProviderTypeId.MICROSOFT_OUTLOOK,
  //   );

  //   if (!calendarProvider && tokens) {
  //     await CalendarProviderDOA.createCalendarProvider({
  //       userId: user.userId,
  //       calendarProviderTypeId: CalendarProviderTypeId.MICROSOFT_OUTLOOK,
  //       email,
  //       accessToken: tokens.access_token || null,
  //       refreshToken: tokens.refresh_token || null,
  //       expiresAt: null,
  //       scopes: tokens.scope || null,
  //       salt: null,
  //     });
  //   } else if (calendarProvider && tokens) {
  //     await CalendarProviderDOA.updateTokens(calendarProvider.calendarProviderId, {
  //       accessToken: tokens.access_token,
  //       refreshToken: tokens.refresh_token || calendarProvider.refreshToken,
  //       expiresAt: null,
  //       scopes: tokens.scope || calendarProvider.scopes,
  //     });
  //   }

  //   await UserDOA.updateLastLogin(user.userId);
  //   return UserDOA.findById(user.userId);
  // }

  // export async function findOrCreateUserFromAppleProfile(identity, tokens = null) {
  //   const email =
  //     identity?.appleUserPayload?.email ||
  //     identity?.profile?.emails?.[0]?.value ||
  //     identity?.decodedIdToken?.email ||
  //     null;
  //   const fullName = identity?.appleUserPayload?.name
  //     ? `${identity.appleUserPayload.name.firstName || ""} ${identity.appleUserPayload.name.lastName || ""}`.trim()
  //     : "";
  //   const name = fullName || identity?.profile?.displayName || email;

  //   if (!email) {
  //     throw new Error("Apple profile did not include an email address");
  //   }

  //   let user = await UserDOA.getUserByEmail(email);

  //   if (!user) {
  //     user = await UserDOA.createUser({
  //       email,
  //       name,
  //       authProviderTypeId: AuthProviderTypeId.APPLE,
  //     });
  //   }

  //   if (tokens) {
  //     await UserDOA.updateUser(user.userId, {
  //       authprovidertypeid: AuthProviderTypeId.APPLE,
  //       accesstoken: tokens.access_token || user.accessToken,
  //       refreshtoken: tokens.refresh_token || user.refreshToken,
  //       scopes: tokens.scope || user.scopes,
  //       isexpired: false,
  //     });
  //   }

  //   await UserDOA.updateLastLogin(user.userId);
  //   return UserDOA.findById(user.userId);
  // }

  // function scopeToArray(scope) {
  //   if (!scope) return [];
  //   if (Array.isArray(scope)) return scope;
  //   return String(scope)
  //     .split(" ")
  //     .map((item) => item.trim())
  //     .filter(Boolean);
  // }

  // function parseAppleUser(value) {
  //   if (!value) return null;
  //   if (typeof value === "object") return value;
  //   if (typeof value !== "string") return null;
  //   try {
  //     return JSON.parse(value);
  //   } catch {
  //     return null;
  //   }
  // }

export default passport;
