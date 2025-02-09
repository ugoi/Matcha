import { Server } from "socket.io";
import _ from "lodash";
import { profilesRepository } from "../profiles/profiles.repository.js";
import { notificationRepository } from "./notification.repository.js";
import { notificationObjectRepository } from "./notification-object.repository.js";
import {
  NOTIFICATION_ENTITY_TYPE_STRING,
  NOTIFICATION_STATUS,
  NOTIFICATION_STATUS_STRING,
} from "./notification.interface.js";
import { notificationChangeRepository } from "./notification-change.repository.js";
import { notificationsWebsocketService } from "./notifications.websocket.service.js";
import { notificationService } from "./notifications.service.js";
import { NotificationResponse } from "./notification.response.interface.js";
import { socketioDefaultErrorHandler } from "../../error-handlers/socketio-default-error-handler.js";

// Define a placeholder for deleted users
const DELETED_USER_PLACEHOLDER = {
  user_id: "deleted",
  first_name: "Deleted",
  username: "deleted",
  profile_picture: "",
};

export function initNotificationsSocket(io: Server) {
  /**
   * Listen on provided port, on all network interfaces.
   */
  io.of("/api/notifications").on("connection", async (socket) => {
    try {
      // @ts-ignore
      const userId = socket.request.user.user_id;
      // the user ID is used as a room
      socket.join(`user:${userId}`);

      // Retrieve notifications for the user
      const sentNotifications = await notificationRepository.findByNotifierId(
        userId,
        NOTIFICATION_STATUS.SENT
      );

      if (sentNotifications && sentNotifications.length > 0) {
        for (const notification of sentNotifications) {
          try {
            const notificationObject =
              await notificationObjectRepository.findOne(
                notification.notification_object_id
              );
            const notificationChanges =
              await notificationChangeRepository.findByNotificationObjectId(
                notificationObject.id
              );
            let senderAccount = DELETED_USER_PLACEHOLDER;
            if (notificationChanges && notificationChanges.length > 0) {
              const sender = notificationChanges[0].actor_id;
              senderAccount =
                (await profilesRepository.findOne(sender)) ||
                DELETED_USER_PLACEHOLDER;
            }
            const message = await notificationService.createMessage(
              notification.id
            );

            const notificationResponse: NotificationResponse = {
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

            // Send the notification using your websocket service
            notificationsWebsocketService.sendNotification({
              notificationResponse,
              receivers: [userId],
            });
          } catch (innerErr) {
            // Log error for individual notification processing and continue with the next one.
            console.error(
              `Error processing notification ${notification.id}:`,
              innerErr
            );
          }
        }
      }
    } catch (error) {
      // Catch any unexpected errors in the connection callback itself.
      console.error("Error in notifications socket connection:", error);
      socketioDefaultErrorHandler(error, socket);
    }

    socket.on("disconnect", () => {
      // Handle cleanup if needed
    });
  });
}
