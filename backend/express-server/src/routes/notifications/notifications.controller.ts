import { Router } from "express";
import { body, param, validationResult } from "express-validator";
var router = Router();
import passport, { Profile } from "passport";
import { escapeErrors } from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import { mockNotifications } from "./notifications.interface.js";

// TODO: Implement notificationsService
/* Get user notifications*/
router.get(
  "/",
  //   passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      //   const profile = await notificationsService.getNotifications(req.user.user_id);
      res.json({
        message: "success",
        data: { notifications: mockNotifications },
      });
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
