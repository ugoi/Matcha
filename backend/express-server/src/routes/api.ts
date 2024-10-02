import { Router } from "express";
var router = Router();
import authRouter from "./auth/auth.controller.js";
import accountRouter from "./account/account.controller.js";

router.use(authRouter);
router.use("/account", accountRouter);

export default router;
