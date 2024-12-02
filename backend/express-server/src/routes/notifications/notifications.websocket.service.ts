import { Server } from "socket.io";
import { socketioDefaultErrorHandlerIO } from "../../error-handlers/socketio-default-error-handler.js";
import { io } from "../../config/socketio-config.js";
import { NotificationResponse } from "./notification.response.interface.js";
import { NOTIFICATION_STATUS } from "./notification.interface.js";
import { notificationRepository } from "./notification.repository.js";

/**
 * NotificationsWebsocketService class
 *
 * This class is responsible for sending notifications to the client
 * using websockets.
 *
 * @param io - The socket.io server instance
 *
 * @method sendNotification - Sends a notification to the client
 *
 * @returns void
 *
 * @example
 *
 * const notificationResponse = {
 *  id: "6b6fc2a7-7ca4-4859-ba0b-ccb60b176f90",
 * type: "like",
 * created_at: "2024-11-30T18:46:33.354Z",
 * status: "unread",
 * sender: {
 *  id: "4394a413-890b-4e42-a70f-ad3ef0f038a1",
 * name: "TestFirstName",
 * username: "testuser",
 * avatar_url: "https://example.com/avatar.jpg"
 * },
 * entity: {
 * id: "post_id_123",
 * type: "post"
 * },
 * message: "{sender_name} liked your {entity_type}"
 * };
 *
 * const receivers = ["user_id_1", "user_id_2"];
 *
 * notificationsWebsocketService.sendNotification({ notificationResponse, receivers });
 *
 * @category Services
 */
export class NotificationsWebsocketService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Sends a notification to the client
   *
   * @param notificationResponse - The notification response object
   * @param receivers - The list of receivers to send the notification to
   *
   * @returns void
   */
  async sendNotification({
    notificationResponse,
    receivers,
  }: {
    notificationResponse: NotificationResponse;
    receivers: string[];
  }) {
    try {
      const io = this.io;

      for (
        let receiver_index = 0;
        receiver_index < receivers.length;
        receiver_index++
      ) {
        const receiver = receivers[receiver_index];
        io.of("/api/notifications")
          .to(`user:${receiver}`)
          .emit(
            "notification",
            "notification",
            {
              status: "success",
              data: notificationResponse,
            },
            async (err, response) => {
              if (err) {
              } else {
                await notificationRepository.update({
                  id: notificationResponse.id,
                  status: NOTIFICATION_STATUS.RECEIVED,
                });
              }
            }
          );
      }
    } catch (error) {
      console.log(error);
      socketioDefaultErrorHandlerIO(
        error,
        this.io,
        notificationResponse.sender.id
      );
      return;
    }
  }
}

// Create an instance of the NotificationsWebsocketService
export const notificationsWebsocketService = new NotificationsWebsocketService(
  io
);
