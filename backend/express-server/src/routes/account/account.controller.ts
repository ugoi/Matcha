import { Router } from "express";
var router = Router();
import passport from "passport";

/* Get account details*/
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const user = await req.user;
      res.json({ message: "success", data: user });
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
