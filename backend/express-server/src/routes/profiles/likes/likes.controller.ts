import { Router } from "express";
import passport from "passport";
import {
  escapeErrors,
  likeExists,
  profileExists,
  profileExistsValidator,
  profileNotDisliked,
  profileNotLiked,
} from "../../../utils/utils.js";
import { likesRepository } from "./likes.repository.js";
import { param, validationResult } from "express-validator";
import { JFail } from "../../../error-handlers/custom-errors.js";
import { likesService } from "./likes.service.js";

var router = Router();

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

/* Like a user*/
router.post(
  "/:user_id/like",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  param("user_id")
    .isUUID()
    .custom(profileExistsValidator)
    .custom(profileNotLiked),
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
  param("user_id").isUUID().custom(profileExistsValidator).custom(profileNotDisliked),
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

export default router;
