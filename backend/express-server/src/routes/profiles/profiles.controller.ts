import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
var router = Router();
import passport from "passport";
import {
  escapeErrors,
  isAuthorized,
  pictureExists,
  profileNotExists,
  validateFilterOperators,
} from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import {
  searchPreferencesRepository,
  userReportsRepository,
} from "./profiles.repository.js";
import { profilesService } from "./profiles.service.js";
import visitsRouter from "./visits/visits.controller.js";
import interestsRouter from "./interests/interests.controller.js";
import likesRouter from "./likes/likes.controller.js";
import blocksRouter from "./blocks/blocks.controller.js";
import picturesRouter from "./pictures/pictures.controller.js";
import { PublicProfile } from "./profiles.interface.js";
import { SuccessResponse } from "../../interfaces/response.js";
import { validationLimits } from "../../config/validation-config.js";
// Import your SuccessResponse class (adjust path as needed)

const validateProfilePicture = (isOptional = false) => {
  let chain = body("profile_picture").isURL().custom(pictureExists);
  return isOptional ? chain.optional() : chain;
};

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
  query("filter_by")
    .optional()
    .custom(validateFilterOperators)
    .withMessage(
      (value) =>
        `Invalid filter: ${value}. Valid fields are: user_id, age, distance, fame_rating, common_interests, interests, username, email, gender, sexual_preference. Valid operators are: $eq, $neq, $gt, $gte, $lt, $lte, $in, $not_in`
    ),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
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
        limit: req.query.limit || 20,
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

/* Create my user profile - supports initializing search preferences (age_min, age_max, location_radius, fame_rating_min, fame_rating_max, interests_filter, common_interests). These can also be updated later using PATCH */
router.post(
  "/me",
  passport.authenticate("jwt", { session: false }),
  profileNotExists,
  body("gender")
    .escape()
    .isString()
    .isLength({ max: validationLimits.gender.max })
    .toLowerCase(),
  body("age")
    .escape()
    .isNumeric()
    .isInt({ min: validationLimits.age.min, max: validationLimits.age.max }),
  body("sexual_preference")
    .escape()
    .isString()
    .isLength({ max: validationLimits.sexualPreference.max })
    .toLowerCase(),
  body("biography")
    .escape()
    .isString()
    .isLength({ max: validationLimits.bio.max }),
  body("profile_picture").isURL().custom(pictureExists),
  body("gps_latitude").escape().isNumeric(),
  body("gps_longitude").escape().isNumeric(),
  // New validators for search preferences
  body("age_min")
    .optional()
    .isInt({ min: validationLimits.age.min, max: validationLimits.age.max })
    .toInt(),
  body("age_max")
    .optional()
    .isInt({ min: validationLimits.age.min, max: validationLimits.age.max })
    .toInt(),
  body("fame_rating_min").optional().isInt().toInt(),
  body("fame_rating_max").optional().isInt().toInt(),
  body("location_radius").optional().isFloat().toFloat(),
  body("interests_filter").optional().isString(),
  body("common_interests").optional().isInt().toInt(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors }));
      return;
    }

    try {
      // Destructure search preference fields from req.body
      const {
        age_min,
        age_max,
        fame_rating_min,
        fame_rating_max,
        location_radius,
        interests_filter,
        common_interests,
        ...profileData
      } = req.body;

      await profilesService.createProfile({
        user_id: req.user.user_id,
        data: profileData,
        search_preferences: {
          age_min,
          age_max,
          fame_rating_min,
          fame_rating_max,
          location_radius,
          interests_filter,
          common_interests,
        },
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

//   -- Advanced Search Table: This could store user preferences for searches (only visible to the user)
// CREATE TABLE IF NOT EXISTS search_preferences (
//     search_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
//     age_min INT,
//     age_max INT,
//     fame_rating_min INT,
//     fame_rating_max INT,
//     location_radius FLOAT, -- e.g., 50 km radius
//     interests_filter TEXT -- Store tags as a string or use a more normalized design
// );

/* Update my user profile*/
router.patch(
  "/me",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
  body("gender")
    .optional()
    .escape()
    .isString()
    .isLength({ max: validationLimits.gender.max }),
  body("age")
    .optional()
    .escape()
    .isNumeric()
    .isInt({ min: validationLimits.age.min, max: validationLimits.age.max }),
  body("sexual_preference")
    .optional()
    .escape()
    .isString()
    .isLength({ max: validationLimits.sexualPreference.max }),
  body("biography")
    .optional()
    .escape()
    .isString()
    .isLength({ max: validationLimits.bio.max }),
  body("profile_picture").optional().isURL().custom(pictureExists),
  body("gps_latitude").optional().escape().isNumeric(),
  body("gps_longitude").optional().escape().isNumeric(),
  body("age_min")
    .customSanitizer((value) => (value === "null" ? null : value))
    .optional({ nullable: true })
    .isInt({ min: validationLimits.age.min, max: validationLimits.age.max }),
  body("age_max")
    .customSanitizer((value) => (value === "null" ? null : value))
    .optional({ nullable: true })
    .isInt({ min: validationLimits.age.min, max: validationLimits.age.max }),
  body("fame_rating_min")
    .customSanitizer((value) => (value === "null" ? null : value))
    .optional({ nullable: true })
    .isInt(),
  body("fame_rating_max")
    .customSanitizer((value) => (value === "null" ? null : value))
    .optional({ nullable: true })
    .isInt(),
  body("location_radius")
    .customSanitizer((value) => (value === "null" ? null : value))
    .optional({ nullable: true })
    .isFloat(),
  body("interests_filter")
    .customSanitizer((value) =>
      value === "null" || value === "" ? null : value
    )
    .optional({ nullable: true })
    .isString(),
  body("common_interests")
    .customSanitizer((value) => (value === "null" ? null : value))
    .optional({ nullable: true })
    .isInt(),
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

      // Extract search preferences from request body
      const {
        age_min,
        age_max,
        fame_rating_min,
        fame_rating_max,
        location_radius,
        interests_filter,
        common_interests,
        ...profileData
      } = req.body;

      const search_preferences = {
        age_min,
        age_max,
        fame_rating_min,
        fame_rating_max,
        location_radius,
        interests_filter,
        common_interests,
      };

      // Update profile

      const profile = await profilesService.updateProfile({
        user_id: req.user.user_id,
        data: profileData,
        search_preferences: search_preferences,
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

/* Update last online timestamp */
router.patch(
  "/me/last_online",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
  async function (req, res, next) {
    try {
      await profilesService.updateLastOnline(req.user.user_id);
      const response = new SuccessResponse({
        title: "Last online timestamp updated",
      });
      res.json(response);
    } catch (error) {
      next(error);
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
  body("reason").isString().isLength({
    min: validationLimits.report.min,
    max: validationLimits.report.max,
  }),
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
