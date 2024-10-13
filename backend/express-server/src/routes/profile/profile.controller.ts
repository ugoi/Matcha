import { Router } from "express";
import { body, param, validationResult } from "express-validator";
var router = Router();
import passport, { Profile } from "passport";
import { mockProfile } from "./profile.interface.js";
import { escapeErrors } from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";

// TODO: Implement profileRepository.getProfile
/* Get user details*/
router.get(
  "/:user_id",
  //   passport.authenticate("jwt", { session: false }),
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
      //   const profile = await profileRepository.getProfile(req.params.user_id);
      res.json({ message: "success", data: mockProfile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

// TODO: Implement profileRepository.updateProfile
/* Update user details*/
router.patch(
  "/",
  // passport.authenticate("jwt", { session: false }),
  body("gender").optional().escape().isString(),
  body("age").optional().escape().isNumeric(),
  body("sexual_preference").optional().escape().isString(),
  body("biography").optional().escape().isString(),
  body("interests").optional().escape().isArray(),
  body("pictures").optional().escape().isArray({ max: 5 }),
  body("fame_rating").optional().escape().isNumeric(),
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
      // const profile = await profileRepository.updateProfile(req.body);
      // console.log(req.body["interests[]"]);

      res.json({ message: "success", data: mockProfile });
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
