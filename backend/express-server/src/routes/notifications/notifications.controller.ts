import { Router } from "express";
import { body, param, validationResult } from "express-validator";
var router = Router();
import passport, { Profile } from "passport";
import { arraySanitizer, escapeErrors } from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import { notificationRepository } from "./notification.repository.js";
import { SuccessResponse } from "../../interfaces/response.js";
import { profilesRepository } from "../profiles/profiles.repository.js";
import { notificationObjectRepository } from "./notification-object.repository.js";
import { notificationChangeRepository } from "./notification-change.repository.js";
import {
  NOTIFICATION_ENTITY_TYPE_STRING,
  NOTIFICATION_STATUS_STRING,
} from "./notification.interface.js";
import { notificationService } from "./notifications.service.js";

/* Get user notifications*/
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const notifications = await notificationRepository.findByNotifierId(
        req.user.user_id
      );
      const enrichedNotifications = await Promise.all(
        notifications.map(async (notification) => {
          const notificationObject = await notificationObjectRepository.findOne(
            notification.notification_object_id
          );
          const notificationChanges =
            await notificationChangeRepository.findByNotificationObjectId(
              notificationObject.id
            );
          const DELETED_USER_PLACEHOLDER = {
            user_id: "deleted",
            first_name: "Deleted",
            username: "deleted",
            profile_picture: "",
          };
          let senderAccount = DELETED_USER_PLACEHOLDER;
          if (notificationChanges && notificationChanges.length > 0) {
            const senderId = notificationChanges[0].actor_id;
            senderAccount =
              (await profilesRepository.findOne(senderId)) ||
              DELETED_USER_PLACEHOLDER;
          }
          const message = await notificationService.createMessage(
            notification.id
          );
          return {
            id: notification.id,
            type: NOTIFICATION_ENTITY_TYPE_STRING[
              notificationObject.entity_type
            ],
            created_at: notification.created_at,
            status: NOTIFICATION_STATUS_STRING[notification.status],
            sender: {
              id: senderAccount.user_id,
              name: senderAccount.first_name,
              username: senderAccount.username,
              avatar_url: senderAccount.profile_picture,
            },
            entity: {
              id: notificationObject.entity_id,
            },
            message: message,
          };
        })
      );
      const response = new SuccessResponse({
        notifications: enrichedNotifications,
      });
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

router.patch(
  "/",
  body("ids").optional().customSanitizer(arraySanitizer).isArray(),
  body("ids.*").isUUID(),
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape HTML tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const updatedNotification =
        await notificationRepository.updateByNotifierId({
          notifier_id: req.user.user_id,
          status: req.body.status,
          notification_object_ids: req.body.ids,
        });

      // Return the SuccessResponse
      const response = new SuccessResponse({ updatedNotification });
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
