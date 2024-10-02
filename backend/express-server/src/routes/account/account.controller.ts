import { Router } from "express";
var router = Router();
import { body, param, query, validationResult } from "express-validator";
import { JFail } from "../../error-handlers/custom-errors.js";
import lodash from "lodash";
import { isHtmlTagFree } from "../../utils/utils.js";
import { createAccount } from "./account.service.js";
import { accountRepository } from "./account.repository.js";
import passport, { use } from "passport";
const { unescape, escape } = lodash;

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
