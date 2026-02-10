import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oidc";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config.js";
import GoogleAPIClient from "../model/GoogleApiClient.js";

const router = express.Router();

// Configure the Google strategy for use by Passport.
// passport-openidconnect passes tokens only when the verify callback has 8+ parameters.
// With 9 params (passReqToCallback): req, issuer, profile, context, idToken, accessToken, refreshToken, params, verified
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
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
          await GoogleAPIClient.findOrCreateUserFromGoogleProfile(profile, tokens);
        req.googleTokens = tokens;
        req.googleProvider = provider;
        verified(null, user);
      } catch (err) {
        verified(err);
      }
    },
  ),
);

// We are stateless (no server-side sessions), so no serialize/deserialize.

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
router.get(
  "/login",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar",
    ],
    accessType: "offline", // Required to get refresh tokens
    prompt: "consent", // Forces consent screen to ensure refresh token is provided
  }),
);

/**
 * GET /auth/google/redirect
 *
 * Handle Google OAuth2 callback, store tokens, issue JWT, and redirect to the frontend.
 * 
 * Flow:
 * 1. Passport middleware authenticates and calls verify callback (above)
 * 2. Verify callback stores tokens in req.googleTokens
 * 3. This handler stores tokens in database, issues app JWT, and redirects
 */
router.get(
  "/redirect",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  async (req, res) => {
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

      // Issue our own JWT for app authentication (separate from Google tokens)
      // This JWT identifies the user in our system and is used for protected routes
      const token = jwt.sign({ userId: user.userid }, jwtSecret, {
        expiresIn: "7d",
      });

      // Set JWT as HTTP-only cookie for security
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend
      const frontendBase =
        process.env.APP_BASE_URL || "http://localhost:5000";
      res.redirect(frontendBase);
    } catch (error) {
      console.error("Error in Google OAuth redirect handler:", error);
      const frontendBase =
        process.env.APP_BASE_URL || "http://localhost:5000";
      res.status(500).redirect(`${frontendBase}/login?error=oauth_failed`);
    }
  },
);

export default router;

