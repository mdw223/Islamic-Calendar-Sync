import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { defaultLogger, extractUserId } from "./middleware/Logger.js";
import UserDOA from "./model/db/doa/UserDOA.js";
import { Strategy as GoogleStrategy } from "passport-google-oidc";
import { appConfig, googleAuthConfig, jwtConfig } from "./Config.js";
import CalendarProviderDOA from "./model/db/doa/CalendarProviderDOA.js";
import jwt from "jsonwebtoken";
import { AuthProviderTypeId, CalendarProviderTypeId } from "./Constants.js";
import { generateForNewUser } from "./services/IslamicEventService.js";

/**
 * Issue a signed JWT for the given user. Used after email code verify and Google OAuth.
 * Payload: { sub: userId }, exp set to jwtConfig.EXPIRY_DAYS from now.
 */
export function signToken(user) {
  const payload = { sub: user.userId };
  return jwt.sign(payload, jwtConfig.SECRET, {
    algorithm: jwtConfig.ALGORITHM,
    expiresIn: jwtConfig.EXPIRY_DAYS + "d",
  });
}

// JWT strategy: extract token from Authorization: Bearer <token>, verify, load user, set req.user
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
 * Optional JWT auth middleware: if Authorization Bearer token is present and valid,
 * sets req.user; otherwise leaves req.user undefined. Never sends 401 (so public and
 * protected routes can share the same pipeline).
 */
export function optionalJwtAuth(req, res, next) {
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

    if (tokens) {
      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

      // Store OAuth tokens in User table for authentication
      await UserDOA.updateUser(user.userId, {
        accesstoken: tokens.access_token,
        refreshtoken: tokens.refresh_token || null,
        expiresat: expiresAt,
        scopes: tokens.scope || null,
        isexpired: false,
      });
    }

    const token = signToken(user);
    const frontendBase = appConfig.BASE_URL;
    // Redirect with token in hash so frontend can read and store it (e.g. in memory or localStorage)
    res.redirect(`${frontendBase}#token=${encodeURIComponent(token)}`);
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

    // Calculate expiration time if tokens provided
    const expiresAt = tokens?.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

    // Find or create user with Google auth provider
    let user = await UserDOA.getUserByEmail(email);

    if (!user) {
        // Create new user with Google auth
        user = await UserDOA.createUser({
            email,
            name,
            authProviderTypeId: AuthProviderTypeId.GOOGLE,
        });
        // Store OAuth tokens
        await UserDOA.updateUser(user.userId, {
            accesstoken: tokens?.access_token || null,
            refreshtoken: tokens?.refresh_token || null,
            expiresat: expiresAt,
            scopes: tokens?.scope || null,
            isexpired: false,
        });
    } else if (tokens) {
        // Update existing user with new tokens
        await UserDOA.updateUser(user.userId, {
            authprovidertypeid: AuthProviderTypeId.GOOGLE,
            accesstoken: tokens.access_token,
            refreshtoken: tokens.refresh_token || user.refreshToken,
            expiresat: expiresAt,
            scopes: tokens.scope || user.scopes,
            isexpired: false,
        });
    }

    // Optionally create/update CalendarProvider for calendar integration
    // This is separate from authentication - used for calendar API access
    let calendarProvider = await CalendarProviderDOA.findByUserAndType(
        user.userId,
        CalendarProviderTypeId.GOOGLE_CALENDAR,
    );

    if (!calendarProvider && tokens) {
        // Create calendar provider for this user
        await CalendarProviderDOA.createCalendarProvider({
            userId: user.userId,
            calendarProviderTypeId: CalendarProviderTypeId.GOOGLE_CALENDAR,
            email,
            accessToken: tokens.access_token || null,
            refreshToken: tokens.refresh_token || null,
            expiresAt: expiresAt,
            scopes: tokens.scope || null,
            salt: null,
        });
    } else if (calendarProvider && tokens) {
        // Update calendar provider tokens
        await CalendarProviderDOA.updateTokens(calendarProvider.calendarProviderId, {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || calendarProvider.refreshToken,
            expiresAt: expiresAt,
            scopes: tokens.scope || calendarProvider.scopes,
        });
    }

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

export default passport;
