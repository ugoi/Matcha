import createError from "http-errors";
import express, { json, urlencoded } from "express";
import { join } from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import apiRouter from "./routes/api.js";
const __dirname = import.meta.dirname;
import cors from "cors";
import { clientErrorHandler } from "./error-handlers/client-error-handler.js";
import { defaultErrorHandler } from "./error-handlers/default-error-handler.js";
import { up } from "./migrations/up.js";
import { initPassport } from "./config/passport-config.js";

// run migrations
up();

var app = express();

// view engine setup
app.set("views", join(__dirname, "../views"));
app.set("view engine", "pug");

app.use(cors());
app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));

app.use(
  cookieParser(process.env.COOKIE_SECRET)
);

app.get("/chat_example", function (req, res) {
  res.sendFile("index.html", {
    root: join(__dirname, "../public/chat_example/"),
  });
});

app.use("/api", apiRouter);
app.use(express.static(join(__dirname, "../../../frontend/react-app/dist")));
app.get("*", function (req, res) {
  res.sendFile("index.html", {
    root: join(__dirname, "../../../frontend/react-app/dist/"),
  });
});

initPassport();

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// client error handler
app.use(clientErrorHandler);

// default error handler
app.use(defaultErrorHandler);

export default app;
