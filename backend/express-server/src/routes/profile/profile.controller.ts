import { Router } from "express";
import { body, param, validationResult } from "express-validator";
var router = Router();
import passport, { Profile } from "passport";
import { mockProfile, mockPublicProfile } from "./profile.interface.js";
import { escapeErrors } from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";

// TODO: Implement profileRepository.getProfile
/* Get user details*/
router.get(
  "/:user_id",
  //   passport.authenticate("jwt", { session: false }),
  param("user_id").isUUID(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      //   const profile = await profileRepository.getProfile(req.params.user_id);
      res.json({ message: "success", data: mockPublicProfile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

// TODO: Implement profileRepository.likeProfile
/* Like a user*/
router.post(
  "/:user_id/like",
  // passport.authenticate("jwt", { session: false }),
  param("user_id").isUUID(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      //   await profileRepository.likeProfile(req.params.user_id);
      res.json({ message: "success" });
    } catch (error) {
      next(error);
      return;
    }
  }
);

// TODO: Implement profileRepository.blockProfile
/* Block a user*/
router.post(
  "/:user_id/block",
  // passport.authenticate("jwt", { session: false }),
  param("user_id").isUUID(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      //   await profileRepository.blockProfile(req.params.user_id);
      res.json({ message: "success" });
    } catch (error) {
      next(error);
      return;
    }
  }
);

// TODO: Implement profileRepository.reportProfile
/* Report a user*/
router.post(
  "/:user_id/report",
  // passport.authenticate("jwt", { session: false }),
  param("user_id").isUUID(),
  body("reason").isString(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      //   await profileRepository.reportProfile(req.params.user_id);
      res.json({ message: "success" });
    } catch (error) {
      next(error);
      return;
    }
  }
);

// TODO: Implement profileRepository.getMatches
/* Get my user details*/
router.get(
  "/",
  // passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      //   const profile = await profileRepository.getProfile(req.user.user_id);
      res.json({ message: "success", data: mockProfile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

// TODO: Implement profileRepository.updateProfile
/* Update user details*/
router.patch(
  "/",
  // passport.authenticate("jwt", { session: false }),
  body("gender").optional().escape().isString(),
  body("age").optional().escape().isNumeric(),
  body("sexual_preference").optional().escape().isString(),
  body("biography").optional().escape().isString(),
  body("interests").optional().escape().isArray(),
  body("pictures").optional().escape().isArray({ max: 5 }),
  body("profile_picture").optional().escape().isString(),
  body("gps_latitude").optional().escape().isNumeric(),
  body("gps_longitude").optional().escape().isNumeric(),

  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      // const profile = await profileRepository.updateProfile(req.body);
      // console.log(req.body["interests[]"]);

      res.json({ message: "success", data: mockProfile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
