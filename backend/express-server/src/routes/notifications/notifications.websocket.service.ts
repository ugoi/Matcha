import { Server } from "socket.io";
import _ from "lodash";
import { escape } from "lodash";
import {
  blockedUsersRepository,
  profilesRepository,
} from "../profiles/profiles.repository.js";
import { socketioDefaultErrorHandler, socketioDefaultErrorHandlerIO } from "../../error-handlers/socketio-default-error-handler.js";
import { notificationRepository } from "./notification.repository.js";
import { notificationObjectRepository } from "./notification-object.repository.js";
import { NOTIFICATION_STATUS } from "./notification.interface.js";
import { notificationChangeRepository } from "./notification-change.repository.js";
import { io } from "../../config/socketio-config.js";

export class NotificationsWebsocketService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  async sendNotification({ entity_type, entity_id, status, receivers, sender }) {
    try {
      const io = this.io;

      // Create a notification object
      const notificationObject = await notificationObjectRepository.create({
        entity_type,
        entity_id,
        status,
      });


      for (let receiver_index = 0; receiver_index < receivers.length; receiver_index++) {
        const receiver = receivers[receiver_index];
         // Check if receiver exists in database
        const profile = await profilesRepository.findOne(receiver);
        if (!profile) {
          console.log("Receiver does not exist");
          continue;
        }
        // Add the notifications to the database
        await notificationRepository.create({
          notification_object_id: notificationObject.id,
          notifier_id: receiver,
          status: NOTIFICATION_STATUS.SENT,
        });
        io.to(`user:${receiver}`).emit("notification", { notificationObject, sender });
      }

    } catch (error) {
      console.log(error);
      socketioDefaultErrorHandlerIO(error, this.io, sender);
      return;
    }
  }
}

export const notificationsWebsocketService = new NotificationsWebsocketService(io);
