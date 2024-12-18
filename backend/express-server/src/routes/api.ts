import { Router } from "express";
var router = Router();
import helloWorldRouter from "./hello-world/hello-world.controller.js";
import authRouter from "./auth/auth.controller.js";
import accountRouter from "./users/users.controller.js";
import profilesRouter from "./profiles/profiles.controller.js";
import chatRouter from "./chats/chats.controller.js";
import notificationsRouter from "./notifications/notifications.controller.js";

router.use("/hello-world", helloWorldRouter);
router.use(authRouter);
router.use("/users", accountRouter);
router.use("/profiles", profilesRouter);
router.use("/chats", chatRouter);
router.use("/notifications", notificationsRouter);

export default router;
