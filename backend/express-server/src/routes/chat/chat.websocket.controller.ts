import { Server } from "socket.io";

export function initChatSocket(io: Server) {
  /**
   * Listen on provided port, on all network interfaces.
   */
  io.of("/api/chat").on("connection", (socket) => {
    console.log("a user connected");
    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    socket.on('chat message', (msg) => {
      console.log('message: ' + msg);
      socket.nsp.emit("chat message", msg);
    });
  });
}
