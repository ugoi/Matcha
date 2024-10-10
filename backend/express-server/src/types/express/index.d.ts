// src/types/express/index.d.ts
import * as express from "express";

import { Account } from "../../routes/user/user.interface.ts";

declare global {
  namespace Express {
    interface User extends Account {}

    interface Request {
      user?: User;
    }
  }
}
