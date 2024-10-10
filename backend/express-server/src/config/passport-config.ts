import passport from "passport";
import { Strategy as JwtStrategy } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { accountRepository } from "../routes/user/user.repository.js";
import { authenticatedWithFederatedProvider } from "../routes/auth/auth.service.js";

export function initPassport() {
  // Configure passport jwt
  var cookieExtractor = function (req) {
    var token = null;
    if (req && req.cookies) {
      token = req.cookies["jwt"];
    }
    return token;
  };
  var opts: any = {};
  opts.jwtFromRequest = cookieExtractor;
  opts.secretOrKey = process.env.JWT_SECRET;
  opts.issuer = process.env.JWT_ISSUER;
  opts.audience = process.env.JWT_AUDIENCE;
  passport.use(
    new JwtStrategy(opts, async function (jwt_payload, done) {
      try {
        const user = await accountRepository.findOne({ id: jwt_payload.sub });
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error, false);
      }
    })
  );

  // Configure passport google
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/api/oauth2/redirect/google",
      },
      async function (accessToken, refreshToken, profile, cb) {
        try {
          const user = await authenticatedWithFederatedProvider(profile);
          return cb(null, user);
        } catch (error) {
          return cb(error);
        }
      }
    )
  );

  // Configure facebook strategy
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/api/oauth2/redirect/facebook",
        profileFields: ["id", "displayName", "photos", "emails", "name"],
      },
      async function (accessToken, refreshToken, profile, cb) {
        try {
          const user = await authenticatedWithFederatedProvider(profile);
          return cb(null, user);
        } catch (error) {
          return cb(error);
        }
      }
    )
  );

  // These functions are required for getting data To/from JSON returned from Providers
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (obj: any, done) {
    done(null, obj);
  });
}
