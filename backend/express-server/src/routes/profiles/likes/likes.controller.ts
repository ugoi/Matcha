import { Router } from "express";
import passport from "passport";
import {
  escapeErrors,
  likeExists,
  isAuthorized,
  profileExistsValidator,
  profileNotDisliked,
  profileNotLiked,
} from "../../../utils/utils.js";
import { likesRepository } from "./likes.repository.js";
import { param, validationResult } from "express-validator";
import { JFail } from "../../../error-handlers/custom-errors.js";
import { likesService } from "./likes.service.js";
import { SuccessResponse } from "../../../interfaces/response.js";
// Make sure to adjust the import path to your SuccessResponse definition

var router = Router();

router.get(
  "/matched",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
  async function (req, res, next) {
    try {
      const matches = await likesRepository.findMatches(req.user.user_id);

      // Return SuccessResponse
      const response = new SuccessResponse({ matches });
      res.json(response);
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
  isAuthorized,
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

      // Return SuccessResponse
      const response = new SuccessResponse({ likes: match });
      res.json(response);
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
  isAuthorized,
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

      // Return SuccessResponse
      const response = new SuccessResponse({ match });
      res.json(response);
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
  isAuthorized,
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

      // Return SuccessResponse
      const response = new SuccessResponse({ match });
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/* Dislike a user*/
router.post(
  "/:user_id/dislike",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
  param("user_id")
    .isUUID()
    .custom(profileExistsValidator)
    .custom(profileNotDisliked),
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

      // Return SuccessResponse
      const response = new SuccessResponse({ match });
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
