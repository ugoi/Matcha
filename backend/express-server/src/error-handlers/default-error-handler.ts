import { ErrorResponse } from "../interfaces/response.js";

export function defaultErrorHandler(err, req, res, next) {
  const message =
    req.app.get("env") === "development" ? err.message : "An error occurred";

  const stack = req.app.get("env") === "development" ? err.stack : null;

  const data = stack ? { stack } : null;

  const errorResponse = new ErrorResponse(message, data);

  res.json(errorResponse);
}
