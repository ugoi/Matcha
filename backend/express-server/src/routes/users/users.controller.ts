import { Router } from "express";
import { body, validationResult } from "express-validator";
var router = Router();
import passport from "passport";
import { mockUser, ProtectedUser, User } from "./users.interface.js";
import {
  emailNotExists,
  escapeErrors,
  isHtmlTagFree,
  usernameNotExists,
} from "../../utils/utils.js";
import { userRepository } from "./users.repository.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import { SuccessResponse } from "../../interfaces/response.js";

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
  body("username").optional().isString().custom(isHtmlTagFree),
  body("email").optional().isEmail().custom(isHtmlTagFree),
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
      const user = await userRepository.update({
        user_id: req.user.user_id,
        data: req.body,
      });
      // const protectedUser = new ProtectedUser(mockUser)

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
