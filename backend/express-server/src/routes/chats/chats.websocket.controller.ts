import { Server } from "socket.io";
import _ from "lodash";
import { profilesRepository } from "../profiles/profiles.repository.js";
import { chatRepository } from "./chats.repository.js";
import { socketioDefaultErrorHandler } from "../../error-handlers/socketio-default-error-handler.js";
import { notificationService } from "../notifications/notifications.service.js";
import {
  NOTIFICATION_ENTITY_TYPE,
  NOTIFICATION_STATUS,
} from "../notifications/notification.interface.js";
import { blockedUsersRepository } from "../profiles/blocks/blocks.repository.js";
import { validationLimits } from "../../config/validation-config.js";

export function initChatSocket(io: Server) {
  /**
   * Listen on provided port, on all network interfaces.
   */
  io.of("/api/chat").on("connection", (socket) => {
    try {
      // If user info is missing, disconnect immediately
      if (!socket.request.user) {
        socket.disconnect();
        return;
      }

      const userId = socket.request.user.user_id;
      // the user ID is used as a room
      socket.join(`user:${userId}`);

      // Global error event on the socket to catch any unexpected errors
      socket.on("error", (err) => {
        console.error("Socket encountered an error:", err);
      });

      socket.on("disconnect", () => {
        // Optional cleanup on disconnect
      });

      socket.on("chat message", async ({ msg, receiver }) => {
        try {
          // Validate message length
          if (
            !msg ||
            typeof msg !== "string" ||
            msg.length < validationLimits.message.min ||
            msg.length > validationLimits.message.max
          ) {
            socket.nsp
              .to(`user:${userId}`)
              .emit(
                "error",
                `Message must be between ${validationLimits.message.min} and ${validationLimits.message.max} characters`
              );
            return;
          }

          // Safely escape the message
          msg = _.escape(msg);
          const sender = userId;

          // Check that the receiver exists
          const profile = await profilesRepository.findOne(receiver);
          if (!profile) {
            socket.nsp
              .to(`user:${sender}`)
              .emit("error", "Receiver does not exist");
            return;
          }

          // Check if sender and receiver block each other (execute in parallel)
          const [senderBlockedReceiver, receiverBlockedSender] =
            await Promise.all([
              blockedUsersRepository.findOne(sender, receiver),
              blockedUsersRepository.findOne(receiver, sender),
            ]);
          const messagingAllowed =
            !senderBlockedReceiver && !receiverBlockedSender;

          if (messagingAllowed) {
            // Add the message to the database
            const message = await chatRepository.create({
              sender_user_id: sender,
              receiver_user_id: receiver,
              message: msg,
            });

            // Emit the message to the recipient
            socket.nsp
              .to(`user:${receiver}`)
              .emit("chat message", { msg, sender });

            // Create and send a notification for the new message
            await notificationService.createAndSend({
              entity_type: NOTIFICATION_ENTITY_TYPE.MESSAGE,
              entity_id: message.chat_id,
              status: NOTIFICATION_STATUS.SENT,
              receivers: [receiver],
              sender: sender,
            });
          } else {
            console.warn(
              "Messaging not allowed between",
              sender,
              "and",
              receiver
            );
            socket.nsp
              .to(`user:${sender}`)
              .emit("error", "Messaging not allowed");
          }
        } catch (error) {
          console.error("Error processing chat message:", error);
          // Notify the client about the error without crashing the server
          socket.emit(
            "error",
            "An error occurred processing your message. Please try again later."
          );
          socketioDefaultErrorHandler(error, socket);
        }
      });
    } catch (error) {
      console.error(
        "Error during chat socket connection initialization:",
        error
      );
      if (socket && socket.emit) {
        socket.emit(
          "error",
          "An error occurred initializing your chat connection."
        );
      }
      socketioDefaultErrorHandler(error, socket);
    }
  });
}
