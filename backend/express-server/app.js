import createError from "http-errors";
import express, { json, urlencoded } from "express";
import { join } from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import apiRouter from "./routes/api.js";
const __dirname = import.meta.dirname;
import db from "./db-object.js";

const sql = `
  CREATE TABLE IF NOT EXISTS accounts (
    user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE, 
    password TEXT,
    salt TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE, 
    created_at TIMESTAMP NOT NULL, 
    last_login TIMESTAMP
  );
`;
db.none(sql)
  .then(() => {
    //Success
  })
  .catch((error) => {
    console.log("ERROR:", error); // print error;
  });

var app = express();

// view engine setup
app.set("views", join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
// app.use("/static", express.static(path.join(__dirname, "public")));

// app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api", apiRouter);

app.use(express.static(join(__dirname, "../../frontend/react-app/dist")));

app.get("*", function (req, res) {
  res.sendFile("index.html", {
    root: join(__dirname, "../../frontend/react-app/dist/"),
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export default app;
