// src/types/express/index.d.ts
import * as express from "express";
import { User as AppUser } from "../../routes/users/users.interface.ts";
import { IncomingMessage } from "http";
import { Socket as IoSocket } from "socket.io";

declare global {
  namespace Express {
    interface User extends AppUser {}

    interface Request {
      user?: User;
    }
  }
}

// Extend IncomingMessage to include the user property
declare module "http" {
  interface IncomingMessage {
    user?: AppUser; // Optional user property
  }
}
