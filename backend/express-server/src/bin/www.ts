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
import { initNotificationsSocket } from "../routes/notifications/notifications.websocket.controller.js";
import { io } from "../config/socketio-config.js";
import { port, server } from "../config/server-config.js";
import { initNotificationsService } from "../routes/notifications/notifications.websocket.service.js";

/**
 * Initialize socket.io
 */

initNotificationsService(io);

initChatSocket(io);

initNotificationsSocket(io);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

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
