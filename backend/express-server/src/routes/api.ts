import { Router } from "express";
var router = Router();
import authRouter from "./auth/auth.controller.js";
import accountRouter from "./user/user.controller.js";

router.use(authRouter);
router.use("/user", accountRouter);

export default router;
