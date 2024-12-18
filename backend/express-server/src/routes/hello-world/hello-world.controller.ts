import { Router } from "express";
var router = Router();

/* Check if user is authenticated */
router.get(
  "/",
  function (req, res) {
    const response = "Hello World";
    res.json(response);
  }
);

export default router;
