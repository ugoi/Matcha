import { Router } from "express";
import { body, query, validationResult } from "express-validator";
var router = Router();
import passport, { Profile } from "passport";
import { mockPublicProfiles } from "../profile/profile.interface.js";
import { escapeErrors } from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import {
  blockedUsersRepository,
  likesRepository,
  profileRepository,
  userReportsRepository,
} from "../profile/profile.repository.js";

/* Get user details*/
router.get(
  "/",
  //   passport.authenticate("jwt", { session: false }),
  query("ids").optional().isArray(),
  query("age").optional().isNumeric(),
  query("location").optional().isString(),
  query("fame_rating").optional().isNumeric(),
  query("tags").optional().isArray(),
  query("age_gap").optional().isNumeric(),
  query("fame_rating_gap").optional().isNumeric(),
  query("sort_by")
    .optional()
    .isString()
    .isIn(["age", "location", "fame_rating", "common_tags"]),
  query("order").optional().isString().isIn(["asc", "desc"]),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const profiles = await profileRepository.find();
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

// TODO: Implement profileRepository.getProfile
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

// TODO: Implement profileRepository.getProfile
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

export default router;
