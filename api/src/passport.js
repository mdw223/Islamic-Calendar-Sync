import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import UserDOA from "./model/db/doa/UserDOA.js";
import { Strategy as GoogleStrategy } from "passport-google-oidc";
import { appConfig, googleAuthConfig, jwtConfig } from "./config.js";
import { findOrCreateUserFromGoogleProfile } from "./endpoints/users/GetUser.js";
import ProviderDOA from "./model/db/doa/ProviderDOA.js";
import jwt from "jsonwebtoken";

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
          await findOrCreateUserFromGoogleProfile(profile, tokens);
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
    console.error("Error in Google OAuth redirect handler:", error);
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

export default passport;
