import { Socket } from "socket.io";

export function socketioDefaultErrorHandler(err, socket: Socket) {
  const message =
    process.env.NODE_ENV === "production" ? "An error occurred" : err.message;

  const sender = socket.request.user.user_id;

  const res = {
    status: err.status || "error",
    message: message || null,
    data: err.data,
  };

  socket.nsp.to(`user:${sender}`).emit("error", res);
}
