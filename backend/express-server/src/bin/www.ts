#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from "../app.js";
import debugF from "debug";
var debug = debugF("express-server:server");
import { createServer } from "http";
import { Server } from "socket.io";
import { initChatSocket } from "../routes/chats/chats.websocket.controller.js";
import passport from "passport";

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

var server = createServer(app);

/**
 * Create Socket.io server.
 */

const io = new Server(server);

io.engine.use((req, res, next) => {
  const isHandshake = req._query.sid === undefined;
  if (isHandshake) {
    passport.authenticate("jwt", { session: false })(req, res, next);
  } else {
    next();
  }
});

/**
 * Initialize socket.io
 */

initChatSocket(io);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

export { server };
