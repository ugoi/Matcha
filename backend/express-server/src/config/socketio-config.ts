/**
 * Create Socket.io server.
 */

import { Server } from "socket.io";
import passport from "passport";
import { createServer } from "http";
import { app } from "../express-app.js";

var server = createServer(app);

const io = new Server(server);

io.engine.use((req, res, next) => {
  const isHandshake = req._query.sid === undefined;
  if (isHandshake) {
    passport.authenticate("jwt", { session: false })(req, res, next);
  } else {
    next();
  }
});

export { io };
