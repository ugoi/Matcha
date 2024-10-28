import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
var router = Router();
import passport, { Profile } from "passport";
import { escapeErrors, profileNotExists } from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import {
  blockedUsersRepository,
  likesRepository,
  profilesRepository,
  userReportsRepository,
} from "./profiles.repository.js";
import { interestsRepository } from "./interests.repository.js";
import { picturesRepository } from "./pictures.repository.js";
import { FilterBy, SearchPreferences, SortBy } from "./profiles.interface.js";
import { profileService } from "./profiles.service.js";

/* 
Profiles - All users
-------------------
*/
/* Get user details*/
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  query("username").optional().isString(),
  query("email").optional().isString(),
  query("id").optional().isArray(),
  query("age").optional().isNumeric(),
  query("location").optional().isString(),
  query("fame_rating").optional().isNumeric(),
  query("tags").optional().isArray(),
  query("age_gap").optional().isNumeric(),
  query("fame_rating_gap").optional().isNumeric(),
  query("sort_by").optional(),

  query("filter_by").optional(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      let filter: FilterBy = {};

      let sort_by: SortBy = {};

      if (req.query.sort_by) {
        sort_by = JSON.parse(req.query.sort_by);
      }

      if (req.query.username) filter.username = JSON.parse(req.query.username);
      if (req.query.email) filter.email = JSON.parse(req.query.email);
      if (req.query.id) filter.id = JSON.parse(req.query.id);
      if (req.query.age) filter.age = JSON.parse(req.query.age);
      if (req.query.location) filter.location = JSON.parse(req.query.location);
      if (req.query.fame_rating)
        filter.fame_rating = JSON.parse(req.query.fame_rating);
      if (req.query.tags) filter.tags = JSON.parse(req.query.tags);
      if (req.query.age_gap) filter.age_gap = JSON.parse(req.query.age_gap);
      if (req.query.fame_rating_gap)
        filter.fame_rating_gap = JSON.parse(req.query.fame_rating_gap);

      const search: SearchPreferences = { filter_by: filter, sort_by: sort_by };

      const profiles = await profileService.searchProfiles(search);
      res.json({ message: "success", data: { profiles: profiles } });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Get matches */
/* Get user matches */
router.get(
  "/matched",
  passport.authenticate("jwt", { session: false }),
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

// TODO: Implement profilesRepository.getProfile
/* Get profiles that I blocked */
router.get(
  "/blocks",
  passport.authenticate("jwt", { session: false }),
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

// TODO: Implement profilesRepository.getProfile
/* Get profiles that I reported */
router.get(
  "/reports",
  passport.authenticate("jwt", { session: false }),
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

/* 
-------------------
*/

/* 
Me - Logged In User 
-------------------
*/
/* Get my user details*/
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const profile = await profilesRepository.findOne(req.user.user_id);
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
      const profile = await profilesRepository.findOne(req.params.user_id);
      res.json({ message: "success", data: profile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Create user profile*/
router.post(
  "/me",
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
      const profile = await profilesRepository.create({
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
  "/me",
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
      const profile = await profilesRepository.update({
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
  "/me/interests",
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
  "/me/interests",
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
  "/me/pictures",
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
/* 
-------------------
*/

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

/* Unlike a user*/
router.delete(
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
      await likesRepository.remove(req.user.user_id, req.params.user_id);
      res.json({ message: "success" });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Block a user*/
router.post(
  "/:user_id/block",
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
      await blockedUsersRepository.add(req.user.user_id, req.params.user_id);

      res.json({ message: "success" });
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Unblock a user*/
router.delete(
  "/:user_id/block",
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
      await blockedUsersRepository.remove(req.user.user_id, req.params.user_id);
      res.json({ message: "success" });
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

export default router;
