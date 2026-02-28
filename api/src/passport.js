import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { defaultLogger, extractUserId } from "./middleware/Logger.js";
import UserDOA from "./model/db/doa/UserDOA.js";
import { Strategy as GoogleStrategy } from "passport-google-oidc";
import { appConfig, googleAuthConfig, jwtConfig } from "./config.js";
import ProviderDOA from "./model/db/doa/ProviderDOA.js";
import jwt from "jsonwebtoken";
import { ProviderTypeId } from "./constants.js";
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
        const { user, provider } =
          await findOrCreateUserFromGoogleProfile(profile, tokens, req);
        req.googleTokens = tokens;
        req.googleProvider = provider;
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
    const provider = req.googleProvider;

    if (tokens && provider) {
      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

      await ProviderDOA.updateTokens(provider.providerId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt: expiresAt,
        scopes: tokens.scope || null,
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
   * Find or create a user and provider row based on a Google profile.
   * This is called from the Google Passport strategy, so it MUST NOT
   * talk to the database directly – it delegates to DOAs.
   *
   * @param {Object} profile - Google user profile from OAuth (contains email, name, etc.)
   * @param {Object} tokens - OAuth tokens: { access_token, refresh_token?, expires_in, scope }
   * @returns {Promise<{user: Object, provider: Object}>}
   */
export async function findOrCreateUserFromGoogleProfile(profile, tokens = null, req = null) {
    const email =
        profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const name = profile.displayName || email;

    if (!email) {
        throw new Error("Google profile did not include an email address");
    }

    // Check if the current request has a guest user that should be upgraded
    // instead of creating a new user. This preserves all guest events.
    const guestUser = req?.user?.isGuest ? req.user : null;

    // Find or create user
    let user = await UserDOA.getUserByEmail(email);

    if (!user && guestUser) {
        // Upgrade the guest user to a registered user
        user = await UserDOA.upgradeGuestUser(guestUser.userId, { email, name });
    } else if (!user) {
        user = await UserDOA.createUser({
            email,
            name,
        });
    }

    // Find or create provider row for this user and Google
    let provider = await ProviderDOA.findByUserAndType(
        user.userId,
        ProviderTypeId.GOOGLE,
    );

    // Calculate expiration time if tokens provided
    const expiresAt = tokens?.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

    if (!provider) {
        // Create new provider with initial tokens if available
        provider = await ProviderDOA.createProvider({
            userId: user.userId,
            providerTypeId: ProviderTypeId.GOOGLE,
            email,
            accessToken: tokens?.access_token || null,
            refreshToken: tokens?.refresh_token || null,
            expiresAt: expiresAt,
            scopes: tokens?.scope || null,
            salt: null,
        });
    } else if (tokens) {
        // Update existing provider with new tokens
        // Preserve existing refresh token if new one not provided (Google only gives refresh token on first consent)
        await ProviderDOA.updateTokens(provider.providerId, {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || provider.refreshToken,
            expiresAt: expiresAt,
            scopes: tokens.scope || provider.scopes,
        });
        // Refresh provider data from database
        provider = await ProviderDOA.findByUserAndType(
            user.userId,
            ProviderTypeId.GOOGLE,
        );
    }

    // Update last login timestamp
    await UserDOA.updateLastLogin(user.userId);

    // Auto-generate Islamic events for the current year if this is a new or
    // upgraded user. The upsert makes this idempotent so calling it
    // redundantly is harmless.
    generateForNewUser(user.userId).catch(() => {});

    return { user, provider };
}

export default passport;
