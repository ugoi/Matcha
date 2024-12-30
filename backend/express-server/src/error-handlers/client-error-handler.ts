import { ErrorResponse, FailResponse } from "../interfaces/response.js";
import { JError, JFail, ValidationError } from "./custom-errors.js";

export function clientErrorHandler(err, req, res, next) {
  if (err instanceof JError) {
    const errorResponse = new ErrorResponse(err.message, err.data);
    res.json(errorResponse);
  } else if (err instanceof JFail) {
    const failResponse = new FailResponse(err.data);
    res.json(failResponse);
  } else if (err instanceof ValidationError) {
    const jFail = new JFail({ title: "Validation Error", errors: err.message });
    const failResponse = new FailResponse(jFail.data);
    res.json(failResponse);
  } else if (err.name === "NotFoundError") {
    const jFail = new JFail({ message: err.message, description: "Resource not found" });
    const failResponse = new FailResponse(jFail.data);
    res.json(failResponse);
  } else {
    next(err);
  }
}
