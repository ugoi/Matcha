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
      const pictures = await picturesRepository.find(req.user.user_id);
      const response = new SuccessResponse({ pictures });
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
    .notEmpty()
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

      // For each file, generate a custom filename instead of using the original name,
      // then upload the file to S3.
      const uploadPromises = (req.files as Express.Multer.File[]).map((file) => {
        // Split original name to extract the extension (if any)
        const originalNameParts = file.originalname.split(".");
        const extension = originalNameParts.length > 1 ? `.${originalNameParts.pop()}` : "";

        // Generate a custom filename using timestamp and a random string
        const customFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${extension}`;

        // Override the file's name with the custom filename
        file.originalname = customFilename;
        file.filename = customFilename;

        // Upload the file to S3 using the custom filename
        return uploadToS3(file);
      });
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
  body("pictures")
    .notEmpty()
    .customSanitizer(arraySanitizer)
    .isArray({ max: 5 }),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }

    try {
      const pictures = await picturesRepository.remove(
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

export default router;
