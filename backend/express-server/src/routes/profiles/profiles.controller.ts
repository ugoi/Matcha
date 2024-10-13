import { Router } from "express";
import { body, query, validationResult } from "express-validator";
var router = Router();
import passport, { Profile } from "passport";
import { mockProfiles } from "../profile/profile.interface.js";
import { escapeErrors } from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";

// TODO: Implement profileRepository.getProfile
/* Get user details*/
router.get(
  "/",
  //   passport.authenticate("jwt", { session: false }),
  query("age").optional().isNumeric(),
  query("location").optional().isString(),
  query("fame_rating").optional().isNumeric(),
  query("tags").optional().isArray(),
  query("sort_by").optional()
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
      //   const profile = await profileRepository.getProfile(req.params.user_id);
      res.json({ message: "success", data: { matches: mockProfiles } });
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
