import passport from "passport";
import UserDAO from "./model/db/dao/UserDOA.js";
import { Strategy as GoogleStrategy } from "passport-google-oidc";
import GoogleAPIClient from "./model/GoogleApiClient.js";
import { appConfig, googleAuthConfig } from "./config.js";
import {findOrCreateUserFromGoogleProfile} from "./endpoints/users/GetUser.js"

/**
 * Passport session strategy: serialize/deserialize user to and from the session.
 * Minimal serialization: store only user id; load full user from DB on each request.
 */
passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    cb(null, { id: user.userid });
  });
});

passport.deserializeUser((sessionUser, cb) => {
  process.nextTick(async () => {
    try {
      const user = await UserDAO.findById(sessionUser.id);
      if (!user) {
        return cb(null, null);
      }
      cb(null, user);
    } catch (err) {
      cb(err);
    }
  });
});

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
        // Build tokens object expected by findOrCreateUserFromGoogleProfile and redirect handler
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
 * 
 * Key parameters:
 * - scope: Requested permissions (profile, email, calendar access)
 * - accessType: "offline" REQUIRED to receive refresh tokens
 * - prompt: "consent" Forces consent screen to ensure refresh token is provided
 */
export const googleLogin = passport.authenticate("google", {
  scope: [
    "profile",
    "email",
    "https://www.googleapis.com/auth/calendar",
  ],
  accessType: "offline", // Required to get refresh tokens
  prompt: "consent", // Forces consent screen to ensure refresh token is provided
});

/**
 * GET /auth/google/redirect
 *
 * Handle Google OAuth2 callback, store tokens, establish session, and redirect to the frontend.
 *
 * Flow:
 * 1. Passport middleware authenticates and calls verify callback (above)
 * 2. Verify callback stores tokens in req.googleTokens
 * 3. This handler stores tokens in database, calls req.login(user) to establish session, then redirects
 */
const googleRedirectHandler = async (req, res) => {
  try {
    const user = req.user;
    const tokens = req.googleTokens; // OAuth tokens from verify callback
    const provider = req.googleProvider;

    // Store/update Google OAuth tokens in the PROVIDER table
    // These tokens are used later to call Google Calendar API
    if (tokens && provider) {
      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

      await GoogleAPIClient.updateProviderTokens(provider.providerid, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null, // May be null if user already granted access
        expiresAt: expiresAt,
        scopes: tokens.scope || null,
      });
    }

    // Establish session (Passport serializes user into session)
    req.login(user, (err) => {
      const frontendBase = appConfig.BASE_URL;
      if (err) {
        console.error("Error establishing session after Google OAuth:", err);
        return res
          .status(500)
          .redirect(`${frontendBase}/login?error=oauth_failed`);
      }
      res.redirect(frontendBase);
    });
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
  }),
  googleRedirectHandler,
];

export default passport;
