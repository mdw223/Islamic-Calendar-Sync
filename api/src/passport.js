import passport from "passport";
import UserDAO from "./model/db/dao/UserDOA.js";

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

export default passport;
