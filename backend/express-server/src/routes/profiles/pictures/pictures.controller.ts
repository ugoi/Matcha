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
import { upload, uploadToS3 } from "../../../utils/s3.js";

var router = Router();

router.get(
  "/me/pictures",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const profile = await picturesRepository.find(req.user.user_id);
      const response = new SuccessResponse({ pictures: profile });
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Create user pictures from URLs */
router.post(
  "/me/pictures",
  passport.authenticate("jwt", { session: false }),
  body("pictures")
    .optional()
    .customSanitizer(arraySanitizer)
    .isArray({ max: 5 })
    .custom(picturesNotExists)
    .custom(pictureCount),
  body("pictures.*").isURL(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }

    try {
      const pictures = await picturesRepository.add(
        req.user.user_id,
        req.body.pictures
      );

      const response = new SuccessResponse({ pictures });
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

/* Upload user pictures as files */
router.post(
  "/me/pictures/upload",
  passport.authenticate("jwt", { session: false }),
  upload.array("pictures", 5),
  async function (req, res, next) {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        next(new JFail({ title: "No files uploaded" }));
        return;
      }

      if (req.files.length > 5) {
        next(new JFail({ title: "Maximum 5 pictures allowed" }));
        return;
      }

      // Upload all files to S3 and get their URLs
      const uploadPromises = (req.files as Express.Multer.File[]).map((file) =>
        uploadToS3(file)
      );
      const pictureUrls = await Promise.all(uploadPromises);

      const pictures = await picturesRepository.add(
        req.user.user_id,
        pictureUrls
      );

      const response = new SuccessResponse({ pictures });
      res.json(response);
    } catch (error) {
      console.log(error);
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
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }

    try {
      const profile = await picturesRepository.remove(
        req.user.user_id,
        req.body.pictures
      );

      const response = new SuccessResponse(profile);
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
