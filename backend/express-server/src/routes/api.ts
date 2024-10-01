import { Router } from "express";
var router = Router();
import { body, ValidationError, validationResult } from "express-validator";
import db from "../db-object.js";
import { randomBytes, pbkdf2 } from "crypto";
import bcrypt from "bcrypt";
import { ErrorStatus, JError, JFail } from "../errorHandlers/customErrors.js";
import lodash from "lodash";
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
    }),
  body("password").isStrongPassword(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (result.isEmpty()) {
      let hashedPassword = "";
      try {
        hashedPassword = await bcrypt.hash(req.body.password, 10);
      } catch (error) {
        return next(error);
      }

      try {
        let data = await db.one(
          "INSERT INTO accounts(email, hashed_password, created_at) VALUES($1, $2, $3) RETURNING user_id, email, phone",
          [req.body.email, hashedPassword, new Date()]
        );
        res.json({
          status: "success",
          data: {
            user: {
              id: data.user_id,
              email: data.email,
            },
          },
        });
        return;
      } catch (error) {
        if (error.code == "23505") {
          next(
            new JFail({
              title:
                "The email address you entered is already associated with an account",
            })
          );
          return;
        }

        console.log("ERROR:", error); // print error;
        next(new JError("An error occurred while creating your account"));
        return;
      }
    }

    // Type narrowing: only process 'field' errors that contain 'value'
    const errors = result.array().map((error) => {
      if (error.type === "field" && "value" in error) {
        error.value = escape(error.value);
      }
      return error;
    });

    next(new JFail({ title: "Invalid input", errors: errors }));
  }
);

/* Signs user in with existing account */
router.get("/login", function (req, res, next) {
  res.send("Successfully signed in");
});

export default router;
