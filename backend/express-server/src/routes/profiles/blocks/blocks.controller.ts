import { Router } from "express";
import passport from "passport";
import {
  escapeErrors,
  profileBlocked,
  profileExists,
  profileExistsValidator,
  profileNotBlocked,
} from "../../../utils/utils.js";
import { blockedUsersRepository } from "./blocks.repository.js";
import { param, validationResult } from "express-validator";
import { JFail } from "../../../error-handlers/custom-errors.js";
import exp from "constants";
import { blockedUsersService } from "./blocks.service.js";

var router = Router();

router.get(
  "/blocks",
  passport.authenticate("jwt", { session: false }),
  profileExists,
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

/* Block a user */
router.post(
  "/:user_id/block",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  param("user_id")
    .isUUID()
    .custom(profileExistsValidator)
    .custom(profileBlocked),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors }));
      return;
    }

    try {
      await blockedUsersService.blockUser(req.user.user_id, req.params.user_id);
      res.json({ message: "success" });
    } catch (error) {
      next(error);
    }
  }
);

/* Unblock a user */
router.delete(
  "/:user_id/block",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  param("user_id")
    .isUUID()
    .custom(profileExistsValidator)
    .custom(profileNotBlocked),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors }));
      return;
    }

    try {
      await blockedUsersService.unblockUser(
        req.user.user_id,
        req.params.user_id
      );
      res.json({ message: "success" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
