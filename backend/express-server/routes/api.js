import { Router } from "express";
var router = Router();
import { body, validationResult } from "express-validator";
import db from "../db-object.js";
import { randomBytes, pbkdf2 } from "crypto";

/* Create new account */
router.post(
  "/signup",
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
  function (req, res, next) {
    const result = validationResult(req);
    if (result.isEmpty()) {
      var salt = randomBytes(16);
      pbkdf2(
        req.body.password,
        salt,
        310000,
        32,
        "sha256",
        function (err, hashedPassword) {
          if (err) {
            return next(err);
          }
          db.one(
            "INSERT INTO accounts(email, password, salt, created_at) VALUES($1, $2, $3, $4) RETURNING user_id, email, phone",
            [req.body.email, hashedPassword, salt, new Date()]
          )
            .then((data) => {
              return res.json({
                status: "success",
                data: {
                  user: {
                    id: data.user_id,
                    email: data.email,
                  },
                },
              });
            })
            .catch((error) => {
              if (error.code == "23505") {
                return res.json({
                  status: "fail",
                  data: {
                    title:
                      "The email address you entered is already associated with an account",
                  },
                });
              }

              console.log("ERROR:", error); // print error;
              return res.json({
                status: "error",
                message: "Unable to communicate with database",
              });
            });
        }
      );
      return;
    }

    res.send({
      status: "fail",
      data: { title: "Invalid input", errors: result.array() },
    });
  }
);

/* Signs user in with existing account */
router.get("/login", function (req, res, next) {
  res.send("Successfully signed in");
});

export default router;
