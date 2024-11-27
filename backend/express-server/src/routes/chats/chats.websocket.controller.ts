import { Server } from "socket.io";
import _ from "lodash";
import { escape } from "lodash";
import {
  blockedUsersRepository,
  profilesRepository,
} from "../profiles/profiles.repository.js";
import { chatRepository } from "./chats.repository.js";
import { socketioDefaultErrorHandler } from "../../error-handlers/socketio-default-error-handler.js";
import { notificationsWebsocketService } from "../notifications/notifications.websocket.service.js";
import { notificationService } from "../notifications/notifications.service.js";
import { NOTIFICATION_ENTITY_TYPE, NOTIFICATION_STATUS } from "../notifications/notification.interface.js";

export function initChatSocket(io: Server) {
  /**
   * Listen on provided port, on all network interfaces.
   */
  io.of("/api/chat").on("connection", (socket) => {
    // @ts-ignore
    const userId = socket.request.user.user_id;
    // the user ID is used as a room
    socket.join(`user:${userId}`);
    console.log("a user connected");

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    socket.on("chat message", async ({ msg, receiver }) => {
      try {
        // Ecape the message using lodash escape
        msg = _.escape(msg);

        const sender = socket.request.user.user_id;

        // Check if receiver exists in database
        const profile = await profilesRepository.findOne(receiver);

        if (!profile) {
          console.log("Receiver does not exist");
          socket.nsp
            .to(`user:${sender}`)
            .emit("error", "Receiver does not exist");
          return;
        }

        // Check if receiver or sender block each other
        const senderBlockedReceiver = await blockedUsersRepository.findOne(
          sender,
          receiver
        );
        const receiverBlockedSender = await blockedUsersRepository.findOne(
          receiver,
          sender
        );
        const messagingAllowed =
          !senderBlockedReceiver && !receiverBlockedSender;

        if (messagingAllowed) {
          // Add the message to the database
          const message = await chatRepository.create({
            sender_user_id: sender,
            receiver_user_id: receiver,
            message: msg,
          });

          socket.nsp
            .to(`user:${receiver}`)
            .emit("chat message", { msg, sender });

          const notificationsObject = await notificationService.create({
            entity_type: NOTIFICATION_ENTITY_TYPE.MESSAGE,
            entity_id: message.chat_id,
            status: NOTIFICATION_STATUS.SENT,
            receivers: [receiver],
            sender: sender,
          });

          // Send the notification to the sender
          await notificationsWebsocketService.sendNotification({
            notificationObject: notificationsObject,
            sender: sender,
            receivers: [receiver],
          });
        } else {
          console.log("Messaging not allowed");
          socket.nsp
            .to(`user:${sender}`)
            .emit("error", "Messaging not allowed");
        }
      } catch (error) {
        const sender = socket.request.user.user_id;
        console.log(error);
        socketioDefaultErrorHandler(error, socket);
        return;
      }
    });
  });
}
