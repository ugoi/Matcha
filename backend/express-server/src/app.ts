import createError from "http-errors";
import express, { json, urlencoded } from "express";
import { join } from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import apiRouter from "./routes/api.js";
const __dirname = import.meta.dirname;
import db from "./db-object.js";
import cors from "cors";
import { clientErrorHandler } from "./error-handlers/client-error-handler.js";
import { defaultErrorHandler } from "./error-handlers/default-error-handler.js";
import { up } from "./migrations/up.js";
import passport from "passport";
import { accountRepository } from "./routes/account/account.repository.js";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

up();

var app = express();

// view engine setup
app.set("views", join(__dirname, "../views"));
app.set("view engine", "pug");

app.use(cors());
app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
app.use("/api", apiRouter);
app.use(express.static(join(__dirname, "../../../frontend/react-app/dist")));
app.get("*", function (req, res) {
  res.sendFile("index.html", {
    root: join(__dirname, "../../../frontend/react-app/dist/"),
  });
});

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
      const issuer = profile.provider;
      try {
        let cred = await db.oneOrNone(
          "SELECT * FROM federated_credentials WHERE provider = $1 AND subject = $2",
          [issuer, profile.id]
        );
        if (!cred) {
          // The Google account has not logged in to this app before.  Create a
          // new user record and link it to the Google account.
          let accountData = await db.one(
            "INSERT INTO accounts (display_name) VALUES ($1) RETURNING user_id",
            [profile.displayName]
          );
          var id = accountData.user_id;
          await db.none(
            "INSERT INTO federated_credentials (user_id, provider, subject) VALUES ($1, $2, $3)",
            [id, issuer, profile.id]
          );

          const user = await accountRepository.findOne({ id: id });

          return cb(null, user);
        } else {
          // The Google account has previously logged in to the app.  Get the
          // user record linked to the Google account and log the user in.
          const user = await accountRepository.findOne({ id: cred.user_id });

          if (!user) {
            return cb(null, false);
          }
          return cb(null, user);
        }
      } catch (error) {
        return cb(error);
      }
    }
  )
);

// These functions are required for getting data To/from JSON returned from Providers
passport.serializeUser(function (user, done) {
  console.log("I should have jack ");
  done(null, user);
});
passport.deserializeUser(function (obj: any, done) {
  console.log("I wont have jack shit");
  done(null, obj);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// client error handler
app.use(clientErrorHandler);

// default error handler
app.use(defaultErrorHandler);

export default app;
