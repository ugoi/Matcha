import { Server } from "socket.io";
import {
  socketioDefaultErrorHandlerIO,
} from "../../error-handlers/socketio-default-error-handler.js";
import { io } from "../../config/socketio-config.js";

export class NotificationsWebsocketService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  async sendNotification({ notificationObject, sender, receivers, message }) {
    try {
      const io = this.io;

      for (
        let receiver_index = 0;
        receiver_index < receivers.length;
        receiver_index++
      ) {
        const receiver = receivers[receiver_index];
        io.of("/api/notifications").to(`user:${receiver}`).emit("notification", {
          notificationObject,
          sender,
          message,
        });
      }
    } catch (error) {
      console.log(error);
      socketioDefaultErrorHandlerIO(error, this.io, sender);
      return;
    }
  }
}

export const notificationsWebsocketService = new NotificationsWebsocketService(
  io
);
