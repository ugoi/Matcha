import { Router } from "express";
import passport from "passport";
import {
  escapeErrors,
  profileBlocked,
  isAuthorized,
  profileExistsValidator,
  profileNotBlocked,
} from "../../../utils/utils.js";
import { blockedUsersRepository } from "./blocks.repository.js";
import { param, validationResult } from "express-validator";
import { JFail } from "../../../error-handlers/custom-errors.js";
import { blockedUsersService } from "./blocks.service.js";
import { SuccessResponse } from "../../../interfaces/response.js";

var router = Router();

router.get(
  "/blocks",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
  async function (req, res, next) {
    try {
      const profile = await blockedUsersRepository.find(req.user.user_id);

      // Wrap in SuccessResponse
      const response = new SuccessResponse({ blocks: profile });
      res.json(response);
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
  isAuthorized,
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

      // Wrap in SuccessResponse
      const response = new SuccessResponse({ message: "User blocked" });
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/* Unblock a user */
router.delete(
  "/:user_id/block",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
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

      // Wrap in SuccessResponse
      const response = new SuccessResponse({ message: "User unblocked" });
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
