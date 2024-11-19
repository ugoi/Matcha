import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
var router = Router();
import passport, { Profile } from "passport";
import { escapeErrors, profileExists } from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import { chatRepository } from "./chats.repository.js";


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
      const profile = await chatRepository.create({
        sender_user_id: req.user.user_id,
        receiver_user_id: req.params.user_id,
        message: req.body.message,
      });
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

/* Get messages between two users */
router.get(
  "/:user_id",
  passport.authenticate("jwt", { session: false }),
  profileExists,
  param("user_id").isString(),
  query("next_cursor").optional().isString(),
  query("limit").optional().isInt(),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      const profile = await chatRepository.find({
        sender_user_id: req.user.user_id,
        receiver_user_id: req.params.user_id,
        limit: req.query.limit || 10,
        next_cursor: req.query.next_cursor ? new Date(req.query.next_cursor) : null,
      });
      res.json({
        message: "success",
        data: {
          chats: profile,
        },
      });
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
