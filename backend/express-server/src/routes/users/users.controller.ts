import { Router } from "express";
import { body, validationResult } from "express-validator";
var router = Router();
import passport from "passport";
import { mockUser, ProtectedUser, User } from "./users.interface.js";
import {
  emailNotExistsValidator,
  escapeErrors,
  isHtmlTagFreeValidator,
  usernameNotExistsValidator,
} from "../../utils/utils.js";
import { userRepository } from "./users.repository.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import { SuccessResponse } from "../../interfaces/response.js";
import {
  initiateEmailVerification,
  sendVerificationEmail,
} from "../auth/auth.service.js";
import { createToken } from "../token/token.repository.js";
import { TokenType } from "../token/token.interface.js";

// TODO: Move this into profile and rename everything in profile to user

/* Get user details*/
//TODO: make sure missing fields are inlcuded with null in response
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const user = await req.user;
      const protectedUser = new ProtectedUser(user);
      const response = new SuccessResponse({ user: protectedUser });
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

// TODO: Implement userRepository.updateUser
/* Update user details*/
router.patch(
  "/me",
  passport.authenticate("jwt", { session: false }),
  body("username").optional().isString().custom(isHtmlTagFreeValidator),
  body("email")
    .optional()
    .isEmail()
    .custom(isHtmlTagFreeValidator)
    .custom(emailNotExistsValidator),
  body("first_name").optional().escape().isString(),
  body("last_name").optional().escape().isString(),
  body("phone").optional().escape().isString(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }

    try {
      let user = undefined;
      if (req.body.email) {
        // If email is updated, set is_email_verified to false
        user = await userRepository.update({
          user_id: req.user.user_id,
          data: {
            username: req.body.username,
            email: req.body.email,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            phone: req.body.phone,
            is_email_verified: false,
          },
        });
        initiateEmailVerification(req.body.email);
      } else {
        user = await userRepository.update({
          user_id: req.user.user_id,
          data: {
            username: req.body.username,
            email: req.body.email,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            phone: req.body.phone,
          },
        });
      }

      const protectedUser = new ProtectedUser(user);

      const response = new SuccessResponse({ user: protectedUser });

      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Delete my user profile */

router.delete(
  "/me",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      await userRepository.delete(req.user.user_id);
      const response = new SuccessResponse();
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
