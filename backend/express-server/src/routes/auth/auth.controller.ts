import { Router } from "express";
var router = Router();
import { body, ValidationError, validationResult } from "express-validator";
import db from "../../db-object.js";
import { randomBytes, pbkdf2 } from "crypto";
import bcrypt from "bcrypt";
import {
  ErrorStatus,
  JError,
  JFail,
} from "../../error-handlers/custom-errors.js";
import lodash from "lodash";
import { createAccount } from "./auth.service.js";
const { unescape, escape } = lodash;

/* GET TEST */
router.get("/", function (req, res, next) {
  res.send("API is working properlyhhaa");
});

/* Create new account */
router.post(
  "/signup",
  body("email")
    .isEmail()
    .custom((value) => {
      if (escape(value) !== value) {
        throw new Error("Email cannot contain html tags");
      }
      return true;
    }),
  body("password").isStrongPassword(),

  async function (req, res, next) {
    const result = validationResult(req);
    if (result.isEmpty()) {
      // Create new account
      try {
        const account = await createAccount({
          email: req.body.email,
          password: req.body.password,
        });
        res.json(account);
        return;
      } catch (error) {
        next(error);
        return;
      }
    } else {
      // Escape html tags in error messages for security
      const errors = result.array().map((error) => {
        if (error.type === "field" && "value" in error) {
          error.value = escape(error.value);
        }
        return error;
      });
      next(new JFail({ title: "Invalid inputt", errors: errors }));
    }
  }
);

/* Signs user in with existing account */
router.get("/login", function (req, res, next) {
  res.send("Successfully signed in");
});

export default router;
