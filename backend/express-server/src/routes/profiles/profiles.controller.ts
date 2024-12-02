import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
var router = Router();
import passport, { Profile } from "passport";
import {
  arraySanitizer,
  escapeErrors,
  likeExists,
  pictureCount,
  pictureExists,
  picturesNotExists,
  profileBlocked,
  profileExists,
  profileExistsValidator,
  profileNotBlocked,
  profileNotExists,
  profileNotLiked,
} from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import {
  blockedUsersRepository,
  likesRepository,
  userReportsRepository,
} from "./profiles.repository.js";
import { interestsRepository } from "./interests.repository.js";
import { picturesRepository } from "./pictures.repository.js";
import {
  blockedUsersService,
  interestsService,
  likesService,
  profilesService,
} from "./profiles.service.js";
import visitsRouter from "./visits/visits.controller.js";

router.use("/", visitsRouter);


//#region Profile routes
/* Get my user profile*/
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  async function (req, res, next) {
    try {
      const profile = await profilesService.getProfile(req.user.user_id);
      res.json({ message: "success", data: profile });
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
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      await profilesService.createProfile({
        user_id: req.user.user_id,
        data: req.body,
      });
      // console.log(req.body["interests[]"]);
      res.json({ message: "success", data: { title: "Profile created" } });
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
  profileExists,
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
      const profile = await profilesService.updateProfile({
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

/* Get list of profiles */
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  profileExists,
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
          ? JSON.parse(req.query.filter_by)
          : undefined,
        sort_by: req.query.sort_by ? JSON.parse(req.query.sort_by) : undefined,
      });

      res.json({ message: "success", data: { profiles } });
    } catch (error) {
      next(error);
    }
  }
);
//#endregion

//#region Interests routes
/* Get user interests*/
router.get(
  "/me/interests",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const profile = await interestsRepository.find(req.user.user_id);
      res.json({ message: "success", data: { interests: profile } });
    } catch (error) {
      next(error);
      return;
    }
  }
);
/* Create user interests */
router.post(
  "/me/interests",
  passport.authenticate("jwt", { session: false }),
  body("interests")
    .optional()
    .escape()
    .customSanitizer(arraySanitizer)
    .isArray({ max: 30 }),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors }));
      return;
    }

    try {
      const profile = await interestsService.addInterests(
        req.user.user_id,
        req.body.interests
      );
      res.json({ message: "success", data: profile });
    } catch (error) {
      next(error);
    }
  }
);
/* Delete user interests*/
router.delete(
  "/me/interests",
  passport.authenticate("jwt", { session: false }),
  body("interests")
    .optional()
    .escape()
    .customSanitizer(arraySanitizer)
    .isArray({ max: 30 }),

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
//#endregion

//#region Pictures routes
/*Get user pictures*/
router.get(
  "/me/pictures",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const profile = await picturesRepository.find(req.user.user_id);
      res.json({ message: "success", data: { pictures: profile } });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Create user pictures*/
router.post(
  "/me/pictures",
  passport.authenticate("jwt", { session: false }),
  body("pictures")
    .optional()
    .customSanitizer(arraySanitizer)
    .isArray({ max: 5 })
    .custom(picturesNotExists)
    .custom(pictureCount),

  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const profile = await picturesRepository.add(
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

/* Delete user pictures*/
router.delete(
  "/me/pictures",
  passport.authenticate("jwt", { session: false }),
  body("pictures").customSanitizer(arraySanitizer).isArray({ max: 5 }),

  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const profile = await picturesRepository.remove(
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
//#endregion

//#region likes routes
/* Get user matches */
router.get(
  "/matched",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  async function (req, res, next) {
    try {
      const matches = await likesRepository.findMatches(req.user.user_id);
      res.json({ message: "success", data: { matches: matches } });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Get likes */
router.get(
  "/likes",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const match = await likesRepository.find(req.user.user_id);
      res.json({ message: "success", data: { likes: match } });
    } catch (error) {
      next(error);
      return;
    }
  }
);

//#endregion

//#region blocked routes
/* Get profiles that I blocked */
router.get(
  "/blocks",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  async function (req, res, next) {
    try {
      const profile = await blockedUsersRepository.find(req.user.user_id);
      res.json({ message: "success", data: { blocks: profile } });
    } catch (error) {
      next(error);
      return;
    }
  }
);
//#endregion

//#region reports routes
/* Get profiles that I reported */
router.get(
  "/reports",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  async function (req, res, next) {
    try {
      const profile = await userReportsRepository.find(req.user.user_id);

      res.json({ message: "success", data: { reports: profile } });
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
  profileExists,
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
      const profile = await profilesService.getProfile(req.params.user_id);
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
  profileExists,
  param("user_id").isUUID().custom(profileExistsValidator).custom(profileNotLiked),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const match = await likesService.like(
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

/* Unlike a user */
router.delete(
  "/:user_id/like",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  param("user_id").isUUID().custom(profileExistsValidator).custom(likeExists),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors }));
      return;
    }

    try {
      const match = await likesService.unlikeUser(
        req.user.user_id,
        req.params.user_id
      );
      res.json({ message: "success", data: { match } });
    } catch (error) {
      next(error);
    }
  }
);

/* Dislike a user*/
router.post(
  "/:user_id/dislike",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  param("user_id").isUUID().custom(profileExistsValidator),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const match = await likesService.dislike(
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

/* Block a user */
router.post(
  "/:user_id/block",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  param("user_id")
    .isUUID()
    .custom(profileExistsValidator)
    .custom(profileBlocked),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors }));
      return;
    }

    try {
      await blockedUsersService.blockUser(req.user.user_id, req.params.user_id);
      res.json({ message: "success" });
    } catch (error) {
      next(error);
    }
  }
);

/* Unblock a user */
router.delete(
  "/:user_id/block",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  param("user_id")
    .isUUID()
    .custom(profileExistsValidator)
    .custom(profileNotBlocked),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors }));
      return;
    }

    try {
      await blockedUsersService.unblockUser(
        req.user.user_id,
        req.params.user_id
      );
      res.json({ message: "success" });
    } catch (error) {
      next(error);
    }
  }
);

/* Report a user*/
router.post(
  "/:user_id/report",
  passport.authenticate("jwt", { session: false }),
  profileExists,
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
      await userReportsRepository.add(
        req.user.user_id,
        req.params.user_id,
        req.body.reason
      );
      res.json({ message: "success" });
    } catch (error) {
      next(error);
      return;
    }
  }
);

//#endregion
export default router;
