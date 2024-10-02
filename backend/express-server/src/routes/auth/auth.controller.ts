import { Router } from "express";
var router = Router();
import { body, param, query, validationResult } from "express-validator";
import { JFail } from "../../error-handlers/custom-errors.js";
import lodash from "lodash";
import { createAccount, verifyEmail } from "./auth.service.js";
import { isHtmlTagFree } from "../../utils/utils.js";
const { unescape, escape } = lodash;

/* GET TEST */
router.get("/", function (req, res, next) {
  res.send("API is working properlyhhaa");
});

/* Create new account */
router.post(
  "/signup",
  body("firstName").notEmpty().escape(),
  body("lastName").notEmpty().escape(),
  body("username").notEmpty().custom(isHtmlTagFree),
  body("email").isEmail().custom(isHtmlTagFree),
  body("password").isStrongPassword(),

  async function (req, res, next) {
    const result = validationResult(req);
    if (result.isEmpty()) {
      // Create new account
      try {
        const account = await createAccount({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          username: req.body.username,
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
      next(new JFail({ title: "invalid input", errors: errors }));
    }
  }
);

/* Verify email */
router.patch(
  "/verify-email",
  query("token").notEmpty(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (result.isEmpty()) {
      // Verify email

      try {
        await verifyEmail(req.query.token);
      } catch (error) {
        next(error);
        return;
      }

      res.json({ status: "success", data: { message: "Email verified" } });
    } else {
      next(new JFail({ title: "invalid input", errors: result.array() }));
    }
  }
);

/* Signs user in with existing account */
router.get("/login", function (req, res, next) {
  res.send("Successfully signed in");
});

export default router;
