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
app.use("/api", apiRouter);
app.use(express.static(join(__dirname, "../../../frontend/react-app/dist")));
app.get("*", function (req, res) {
  res.sendFile("index.html", {
    root: join(__dirname, "../../../frontend/react-app/dist/"),
  });
});

// Configure passport
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
  new JwtStrategy(opts, function (jwt_payload, done) {
    try {
      const user = accountRepository.findOne({ id: jwt_payload.sub });
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

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// client error handler
app.use(clientErrorHandler);

// default error handler
app.use(defaultErrorHandler);

export default app;
