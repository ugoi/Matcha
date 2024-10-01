import { Router } from "express";
var router = Router();
import authRouter from "./auth/auth.controller.js";

router.use(authRouter);

export default router;
