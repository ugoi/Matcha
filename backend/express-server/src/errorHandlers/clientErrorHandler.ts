import { ErrorStatus, JError, JFail } from "./customErrors.js";

export function clientErrorHandler(err, req, res, next) {
  if (err instanceof JError) {
    res.json({
      status: err.status,
      message: err.message,
      data: err.data,
    });
  } else if (err instanceof JFail) {
    res.json({
      status: err.status,
      data: err.data,
    });
  } else if (err instanceof TypeError) {
    res.json({
      status: ErrorStatus.Fail,
      data: { title: "Invalid input", errors: err.message },
    });
  } else if (err instanceof SyntaxError) {
    res.json({
      status: ErrorStatus.Fail,
      data: { title: "Invalid input", errors: err.message },
    });
  } else if (err instanceof RangeError) {
    res.json({
      status: ErrorStatus.Fail,
      data: { title: "Invalid input", errors: err.message },
    });
  } else {
    next(err);
  }
}
