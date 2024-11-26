import { Server, Socket } from "socket.io";

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

export function socketioDefaultErrorHandlerIO(err, io: Server, sender: string) {
  const message =
    process.env.NODE_ENV === "production" ? "An error occurred" : err.message;

  const res = {
    status: err.status || "error",
    message: message || null,
    data: err.data,
  };

  io.to(`user:${sender}`).emit("error", res);
}
