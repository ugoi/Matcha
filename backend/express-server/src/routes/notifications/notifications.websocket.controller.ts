import { Server } from "socket.io";
import _ from "lodash";
import { escape } from "lodash";
import {
  blockedUsersRepository,
  profilesRepository,
} from "../profiles/profiles.repository.js";
import {
  socketioDefaultErrorHandler,
  socketioDefaultErrorHandlerIO,
} from "../../error-handlers/socketio-default-error-handler.js";
import { notificationRepository } from "./notification.repository.js";
import { notificationObjectRepository } from "./notification-object.repository.js";
import { NOTIFICATION_STATUS } from "./notification.interface.js";
import { notificationChangeRepository } from "./notification-change.repository.js";

export function initNotificationsSocket(io: Server) {
  /**
   * Listen on provided port, on all network interfaces.
   */
  io.of("/api/notifications").on("connection", async (socket) => {
    // @ts-ignore
    const userId = socket.request.user.user_id;
    // the user ID is used as a room
    socket.join(`user:${userId}`);
    console.log("a user connected");

    // TODO: Check if user has unreceived notifications and send them
    const sentNotifications = await notificationRepository.findByNotifierId(
      userId,
      NOTIFICATION_STATUS.SENT
    );
    if (sentNotifications.length > 0 && sentNotifications) {
      for (let i = 0; i < sentNotifications.length; i++) {
        const notification = sentNotifications[i];
        const notificationObject = await notificationObjectRepository.find(
          notification.notification_object_id
        );
        const notificationChange =
          await notificationChangeRepository.findByNotificationObjectId(
            notificationObject.id
          );
        socket.emit("notification", {
          notificationObject,
          notificationChange: notificationChange[0].actor_id,
        });
      }
    }

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
}
