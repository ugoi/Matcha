// src/types/express/index.d.ts
import * as express from "express";

import { User as AppUser } from "../../routes/user/user.interface.ts";

declare global {
  namespace Express {
    interface User extends AppUser {}

    interface Request {
      user?: User;
    }
  }
}
