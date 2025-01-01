import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
var router = Router();
import passport from "passport";
import {
  escapeErrors,
  isAuthorized,
  isEmailVerified,
  pictureExists,
  profileNotExists,
} from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import { userReportsRepository } from "./profiles.repository.js";
import { profilesService } from "./profiles.service.js";
import visitsRouter from "./visits/visits.controller.js";
import interestsRouter from "./interests/interests.controller.js";
import likesRouter from "./likes/likes.controller.js";
import blocksRouter from "./blocks/blocks.controller.js";
import picturesRouter from "./pictures/pictures.controller.js";
import { PublicProfile } from "./profiles.interface.js";
import { SuccessResponse } from "../../interfaces/response.js";
// Import your SuccessResponse class (adjust path as needed)

// Sub-routes
router.use("/", visitsRouter);
router.use("/", interestsRouter);
router.use("/", likesRouter);
router.use("/", blocksRouter);
router.use("/", picturesRouter);

/* Get list of profiles */
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
  query("sort_by").optional(),
  query("filter_by").optional(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors }));
      return;
    }

    try {
      const profiles = await profilesService.searchProfiles({
        user_id: req.user.user_id,
        filter_by: req.query.filter_by
          ? JSON.parse(req.query.filter_by as string)
          : undefined,
        sort_by: req.query.sort_by
          ? JSON.parse(req.query.sort_by as string)
          : undefined,
      });

      const publicProfiles = profiles.map(
        (profile) => new PublicProfile(profile)
      );

      // Wrap result in SuccessResponse
      const response = new SuccessResponse({ profiles: publicProfiles });
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/* Get my user profile*/
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
  async function (req, res, next) {
    try {
      const profile = await profilesService.getProfile(req.user.user_id);

      // Wrap result in SuccessResponse
      const response = new SuccessResponse(profile);
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Create my user profile*/
router.post(
  "/me",
  passport.authenticate("jwt", { session: false }),
  profileNotExists,
  body("gender").escape().isString().toLowerCase(),
  body("age").escape().isNumeric(),
  body("sexual_preference").escape().isString().toLowerCase(),
  body("biography").escape().isString(),
  body("profile_picture").isURL().custom(pictureExists),
  body("gps_latitude").escape().isNumeric(),
  body("gps_longitude").escape().isNumeric(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors }));
      return;
    }

    try {
      await profilesService.createProfile({
        user_id: req.user.user_id,
        data: req.body,
      });

      // Wrap result in SuccessResponse
      const response = new SuccessResponse({ title: "Profile created" });
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Update my user profile*/
router.patch(
  "/me",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
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
      next(new JFail({ title: "invalid input", errors }));
      return;
    }
    try {
      // Check if both gps_latitude and gps_longitude are provided
      if (
        (req.body.gps_latitude && !req.body.gps_longitude) ||
        (!req.body.gps_latitude && req.body.gps_longitude)
      ) {
        throw new JFail({
          title: "invalid input",
          errors: "Both gps_latitude and gps_longitude must be provided",
        });
      }

      const profile = await profilesService.updateProfile({
        user_id: req.user.user_id,
        data: req.body,
      });

      // Wrap result in SuccessResponse
      const response = new SuccessResponse(profile);
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

//#region reports routes
/* Get profiles that I reported */
router.get(
  "/reports",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
  async function (req, res, next) {
    try {
      const profile = await userReportsRepository.find(req.user.user_id);

      // Wrap result in SuccessResponse
      const response = new SuccessResponse({ reports: profile });
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);
//#endregion

//#region :user_id routes
/* Get user profile*/
router.get(
  "/:user_id",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
  param("user_id").isUUID(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors }));
      return;
    }
    try {
      const profile = await profilesService.getProfile(req.params.user_id);
      const publicProfile = new PublicProfile(profile);

      // Wrap result in SuccessResponse
      const response = new SuccessResponse(publicProfile);
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Report a user*/
router.post(
  "/:user_id/report",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
  param("user_id").isUUID(),
  body("reason").isString(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors }));
      return;
    }
    try {
      await userReportsRepository.add(
        req.user.user_id,
        req.params.user_id,
        req.body.reason
      );

      // Wrap result in SuccessResponse
      const response = new SuccessResponse({ title: "User reported" });
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);
//#endregion

export default router;
