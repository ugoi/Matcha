import { Router } from "express";
var router = Router();
import authRouter from "./auth/auth.controller.js";
import accountRouter from "./users/users.controller.js";
import profilesRouter from "./profiles/profiles.controller.js";
import chatRouter from "./chat/chat.controller.js";
import notificationsRouter from "./notifications/notifications.controller.js";

router.use(authRouter);
router.use("/users", accountRouter);
router.use("/profiles", profilesRouter);
router.use("/chat", chatRouter);
router.use("/notifications", notificationsRouter);

export default router;
