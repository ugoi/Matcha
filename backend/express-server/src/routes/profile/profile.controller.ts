import { Router } from "express";
import { body, param, validationResult } from "express-validator";
var router = Router();
import passport, { Profile } from "passport";
import { mockProfile, mockPublicProfile } from "./profile.interface.js";
import { escapeErrors, profileNotExists } from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import {
  interestsRepository,
  likesRepository,
  profileRepository,
} from "./profile.repository.js";

/* Get my user details*/
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const profile = await profileRepository.findOne(req.user.user_id);
      res.json({ message: "success", data: profile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Get user details*/
router.get(
  "/:user_id",
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
      const profile = await profileRepository.findOne(req.params.user_id);
      res.json({ message: "success", data: profile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Create user profile*/
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  profileNotExists,
  body("gender").escape().isString(),
  body("age").escape().isNumeric(),
  body("sexual_preference").escape().isString(),
  body("biography").escape().isString(),
  body("profile_picture").escape().isString(),

  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const profile = await profileRepository.create({
        user_id: req.user.user_id,
        data: req.body,
      });
      // console.log(req.body["interests[]"]);
      res.json({ message: "success", data: profile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Update user profile*/
router.patch(
  "/",
  passport.authenticate("jwt", { session: false }),
  body("gender").optional().escape().isString(),
  body("age").optional().escape().isNumeric(),
  body("sexual_preference").optional().escape().isString(),
  body("biography").optional().escape().isString(),
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
      const profile = await profileRepository.update({
        user_id: req.user.user_id,
        data: req.body,
      });
      // console.log(req.body["interests[]"]);
      res.json({ message: "success", data: profile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Create user interests*/
router.post(
  "/interests",
  passport.authenticate("jwt", { session: false }),
  body("interests").escape().isArray({ max: 30 }),

  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const profile = await interestsRepository.add(
        req.user.user_id,
        req.body.interests
      );
      // console.log(req.body["interests[]"]);
      res.json({ message: "success", data: profile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Delete user interests*/
router.delete(
  "/interests",
  passport.authenticate("jwt", { session: false }),
  body("interests").escape().isArray({ max: 30 }),

  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const profile = await interestsRepository.remove(
        req.user.user_id,
        req.body.interests
      );
      // console.log(req.body["interests[]"]);
      res.json({ message: "success", data: profile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Create user pictures*/
router.post(
  "/pictures",
  passport.authenticate("jwt", { session: false }),
  body("pictures").isArray({ max: 5 }),
  body("pictures.*").isURL(),

  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const profile = await interestsRepository.add(
        req.user.user_id,
        req.body.pictures
      );
      // console.log(req.body["interests[]"]);
      res.json({ message: "success", data: mockProfile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Delete user pictures*/
router.delete(
  "/pictures",
  passport.authenticate("jwt", { session: false }),
  body("pictures.*").isURL(),
  body("pictures").isArray({ max: 5 }),

  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const profile = await interestsRepository.remove(
        req.user.user_id,
        req.body.pictures
      );
      // console.log(req.body["interests[]"]);
      res.json({ message: "success", data: profile });
    } catch (error) {
      next(error);
      return;
    }
  }
);


/* Like a user*/
router.post(
  "/:user_id/like",
  passport.authenticate("jwt", { session: false }),
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
      const match = await likesRepository.add(
        req.user.user_id,
        req.params.user_id
      );
      res.json({ message: "success", data: { match: match } });
    } catch (error) {
      next(error);
      return;
    }
  }
);

// TODO: Implement profileRepository.unlikeProfile
/* Unlike a user*/
router.delete(
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
      //   await profileRepository.unlikeProfile(req.params.user_id);
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

// TODO: Implement profileRepository.unblockProfile
/* Unblock a user*/
router.delete(
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
      //   await profileRepository.unblockProfile(req.params.user_id);
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

export default router;
