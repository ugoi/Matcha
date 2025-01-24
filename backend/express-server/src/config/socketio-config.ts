/**
 * Create Socket.io server.
 */

import { Server } from "socket.io";
import passport from "passport";
import { server } from "./server-config.js";
import cookieParser from "cookie-parser";

const io = new Server(server);

io.engine.use(cookieParser());

io.engine.use((req, res, next) => {
  const isHandshake = req._query.sid === undefined;
  if (isHandshake) {
    passport.authenticate("jwt", { session: false })(req, res, next);
  } else {
    next();
  }
});

export { io };
