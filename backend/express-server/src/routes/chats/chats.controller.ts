import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
var router = Router();
import passport, { Profile } from "passport";
import {
  escapeErrors,
  isAuthorized,
  profileExistsValidator,
} from "../../utils/utils.js";
import { JFail } from "../../error-handlers/custom-errors.js";
import { chatRepository } from "./chats.repository.js";
import { SuccessResponse } from "../../interfaces/response.js";
import { validationLimits } from "../../config/validation-config.js";

/* 
Send a message to a user
You probably want to use chats.websocket.ts to send messages in real time.
This endpoint is for consumers who want to send messages to users without using websockets
*/
router.post(
  "/:user_id",
  passport.authenticate("jwt", { session: false }),
  isAuthorized,
  param("user_id").isString().custom(profileExistsValidator),
  body("message").escape().isString().isLength({
    min: validationLimits.message.min,
    max: validationLimits.message.max,
  }),
  async function (req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Escape html tags in error messages for security
      const errors = escapeErrors(result.array());
      next(new JFail({ title: "invalid input", errors: errors }));
      return;
    }
    try {
      await chatRepository.create({
        sender_user_id: req.user.user_id,
        receiver_user_id: req.params.user_id,
        message: req.body.message,
      });

      // Return the SuccessResponse here
      const response = new SuccessResponse({
        message: "Message sent successfully",
      });
      res.json(response);
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
  isAuthorized,
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
      const chats = await chatRepository.find({
        sender_user_id: req.user.user_id,
        receiver_user_id: req.params.user_id,
        limit: req.query.limit || 10,
        next_cursor: req.query.next_cursor
          ? new Date(req.query.next_cursor)
          : null,
      });

      // Return the SuccessResponse here
      const response = new SuccessResponse({ chats });
      res.json(response);
    } catch (error) {
      next(error);
      return;
    }
  }
);

export default router;
