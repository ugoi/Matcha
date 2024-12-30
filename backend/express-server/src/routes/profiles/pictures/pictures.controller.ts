import { Router } from "express";
import passport from "passport";
import { body, validationResult } from "express-validator";
import {
  arraySanitizer,
  escapeErrors,
  pictureCount,
  picturesNotExists,
} from "../../../utils/utils.js";
import { JFail } from "../../../error-handlers/custom-errors.js";
import { picturesRepository } from "./pictures.repository.js";
import { SuccessResponse } from "../../../interfaces/response.js";
// Import your SuccessResponse class. Adjust the import path as needed.

var router = Router();

router.get(
  "/me/pictures",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const profile = await picturesRepository.find(req.user.user_id);

      // Return as SuccessResponse
      const response = new SuccessResponse({ pictures: profile });
      res.json(response);
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

      // Return as SuccessResponse
      const response = new SuccessResponse(profile);
      res.json(response);
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

      // Return as SuccessResponse
      const response = new SuccessResponse(profile);
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
