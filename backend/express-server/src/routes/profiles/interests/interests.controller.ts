import { Router } from "express";
import passport from "passport";
import { interestsRepository } from "./interests.repository.js";
import { body, validationResult } from "express-validator";
import { arraySanitizer, escapeErrors } from "../../../utils/utils.js";
import { JFail } from "../../../error-handlers/custom-errors.js";
import { interestsService } from "./interests.service.js";
import { SuccessResponse } from "../../../interfaces/response.js";

var router = Router();

/* Get user interests */
router.get(
  "/me/interests",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const interests = await interestsRepository.find(req.user.user_id);

      // Return as SuccessResponse
      const response = new SuccessResponse({ interests });
      res.json(response);
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
    .notEmpty()
    .customSanitizer(arraySanitizer)
    .isArray({ max: 30 }),
  body("interests.*").isString().escape(),
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

      // Return as SuccessResponse
      const response = new SuccessResponse(profile);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/* Delete user interests */
router.delete(
  "/me/interests",
  passport.authenticate("jwt", { session: false }),
  body("interests")
    .notEmpty()
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

      // Return as SuccessResponse
      const response = new SuccessResponse(profile);
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Get interests of a user */
router.get("/:user_id/interests", async function (req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = escapeErrors(result.array());
    next(new JFail({ title: "invalid input", errors }));
    return;
  }
  try {
    const profile = await interestsRepository.find(req.params.user_id);

    // Return as SuccessResponse
    const response = new SuccessResponse({ interests: profile });
    res.json(response);
  } catch (error) {
    next(error);
    return;
  }
});

export default router;
