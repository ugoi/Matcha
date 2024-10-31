import { Router } from "express";
import { body, param, validationResult } from "express-validator";
var router = Router();
import passport, { Profile } from "passport";
import { escapeErrors, profileExists } from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";

// TODO: Implement chatService
/* Send a message to a user*/
router.post(
  "/:user_id",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  param("user_id").isString(),
  body("message").escape().isString(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      //   const profile = await chatService.sendMessage(req.params.user_id, req.body.message);
      res.json({
        message: "success",
        data: {
          message: "Message sent successfully",
        },
      });
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
