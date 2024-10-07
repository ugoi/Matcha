import { ErrorStatus, JError, JFail } from "./custom-errors.js";

export function clientErrorHandler(err, req, res, next) {
  if (err instanceof JError) {
    res.json(err);
  } else if (err instanceof JFail) {
    res.json(err);
  } else if (err instanceof TypeError) {
    res.json({
      status: ErrorStatus.Fail,
      data: { title: "Type Error", errors: err.message },
    });
  } else if (err instanceof SyntaxError) {
    res.json({
      status: ErrorStatus.Fail,
      data: { title: "Syntax Error", errors: err.message },
    });
  } else if (err instanceof RangeError) {
    res.json({
      status: ErrorStatus.Fail,
      data: { title: "Range Error", errors: err.message },
    });
  } else {
    next(err);
  }
}
