import { Router } from "express";
var router = Router();
import { body, param, query, validationResult } from "express-validator";
import { JFail } from "../../error-handlers/custom-errors.js";
import {
  login,
  createJwtToken,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
  sendVerificationEmail,
} from "./auth.service.js";
import {
  emailNotExists,
  escapeErrors,
  emailVerified,
  isHtmlTagFree,
  usernameNotExists,
} from "../../utils/utils.js";
import { authenticateWithCredentials } from "../auth/auth.service.js";
import { createToken } from "../token/token.repository.js";
import { TokenType } from "../token/token.interface.js";
import { userRepository } from "../users/users.repository.js";
import passport from "passport";
import { profilesService } from "../profiles/profiles.service.js";

/* Check if user is authenticated */
router.get(
  "/check-auth",
  passport.authenticate("jwt", { session: false }),
  function (req, res) {
    res.json({ status: "success", data: { message: "Authenticated" } });
  }
);

/* Create new user */
router.post(
  "/signup",
  body("firstName").notEmpty().escape(),
  body("lastName").notEmpty().escape(),
  body("username").notEmpty().custom(isHtmlTagFree).custom(usernameNotExists),
  body("email").isEmail().custom(isHtmlTagFree).custom(emailNotExists),
  body("password").isStrongPassword(),

  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    // Create new user
    try {
      const user = await authenticateWithCredentials({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
      });
      res.json(user);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Signs user in with existing user */
router.post(
  "/login",
  body("username").notEmpty().custom(emailVerified),
  body("password").notEmpty(),

  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const result = await login({
        username: req.body.username,
        password: req.body.password,
      });

      // Set last_online in profile
      await profilesService.updateLastOnline(result.data.user.id);

      // Set token in cookie
      res.cookie("jwt", result.data.token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      res.json(result);
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Logout */
router.get("/logout", function (req, res) {
  res.clearCookie("jwt");
  res.json({ status: "success", data: { message: "Logged out" } });
});

/* Resend verification email */
router.post(
  "/resend-verification-email",
  body("email").isEmail().escape(),

  async function (req, res, next) {
    try {
      // Resend verification email
      const user = await userRepository.findOne({ email: req.body.email });

      if (!user) {
        next(
          new JFail({ title: "invalid input", errors: ["email not found"] })
        );
        return;
      }

      if (user.is_email_verified) {
        next(
          new JFail({
            title: "invalid input",
            errors: ["email already verified"],
          })
        );
        return;
      }

      const nextMonth = new Date();
      nextMonth.setDate(new Date().getDate() + 30);
      const token = await createToken({
        user_id: user.user_id,
        token_type: TokenType.EmailVerification,
        expiry_date: nextMonth,
        value: user.email,
      });

      await sendVerificationEmail(
        user.first_name,
        user.email,
        `${req.protocol}://${req.get("host")}/verify-email?token=${
          token.token_id
        }`
      );
      res.json({
        status: "success",
        data: { message: "Verification email sent" },
      });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Verify email */
router.patch(
  "/verify-email",
  body("token").notEmpty(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (result.isEmpty()) {
      // Verify email

      try {
        await verifyEmail(req.body.token);
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

/* Send reset password email */
router.post(
  "/reset-password",
  body("email").isEmail().escape(),

  async function (req, res, next) {
    try {
      // Send reset password email
      const nextMonth = new Date();
      nextMonth.setDate(new Date().getDate() + 30);
      const user = await userRepository.findOne({ email: req.body.email });
      const token = await createToken({
        user_id: user.user_id,
        token_type: TokenType.PasswordReset,
        expiry_date: nextMonth,
        value: user.email,
      });

      await sendPasswordResetEmail(
        req.body.email,
        `${req.protocol}://${req.get("host")}/reset-password?token=${
          token.token_id
        }`
      );
      res.json({
        status: "success",
        data: { message: "Reset password email sent" },
      });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Reset password */
router.patch(
  "/reset-password",
  body("token").notEmpty(),
  body("password").isStrongPassword(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (result.isEmpty()) {
      // Reset password
      try {
        await resetPassword(req.body.token, req.body.password);
      } catch (error) {
        next(error);
        return;
      }

      res.json({ status: "success", data: { message: "Password reset" } });
    } else {
      next(new JFail({ title: "invalid input", errors: result.array() }));
    }
  }
);

/* Google login */
router.get(
  "/login/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/* Google login redirect */
router.get(
  "/oauth2/redirect/google",
  passport.authenticate("google", { session: false }),
  async function (req, res, next) {
    try {
      const result = await createJwtToken(req.user);

      // Set token in cookie
      res.cookie("jwt", result.data.token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      res.redirect("/");
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Facebook login */
router.get(
  "/login/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

/* Facebook login redirect */
router.get(
  "/oauth2/redirect/facebook",
  passport.authenticate("facebook", { session: false }),
  async function (req, res, next) {
    try {
      const result = await createJwtToken(req.user);

      // Set token in cookie
      res.cookie("jwt", result.data.token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      res.redirect("/");
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
