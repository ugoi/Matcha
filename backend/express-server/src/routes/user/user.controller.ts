import { Router } from "express";
import { body } from "express-validator";
var router = Router();
import passport from "passport";
import { mockUser, ProtectedUser, User } from "./user.interface.js";
import {
  emailNotExists,
  isHtmlTagFree,
  usernameNotExists,
} from "../../utils/utils.js";

// TODO: Move this into profile and rename everything in profile to user

/* Get user details*/
//TODO: make sure missing fields are inlcuded with null in response
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const user = await req.user;
      const protectedUser = new ProtectedUser(user);
      res.json({ message: "success", data: protectedUser });
    } catch (error) {
      next(error);
      return;
    }
  }
);

// TODO: Implement userRepository.updateUser
/* Update user details*/
router.patch(
  "/",
  // passport.authenticate("jwt", { session: false }),
  body("username").isString().custom(isHtmlTagFree).custom(usernameNotExists),
  body("email").escape().isEmail().custom(isHtmlTagFree).custom(emailNotExists),
  body("first_name").escape().isString(),
  body("last_name").escape().isString(),
  body("phone").escape().isString(),
  async function (req, res, next) {
    try {
      // const user = await userRepository.updateUser(req.body);
      const protectedUser = new ProtectedUser(mockUser);
      res.json({ message: "success", data: protectedUser });
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
