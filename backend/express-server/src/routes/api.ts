import { Router } from "express";
var router = Router();
import authRouter from "./auth/auth.controller.js";
import accountRouter from "./user/user.controller.js";
import profileRouter from "./profile/profile.controller.js";
import profilesRouter from "./profiles/profiles.controller.js";

router.use(authRouter);
router.use("/user", accountRouter);
router.use("/profile", profileRouter);
router.use("/profiles", profilesRouter);


export default router;
