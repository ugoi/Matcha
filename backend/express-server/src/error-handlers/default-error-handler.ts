export function defaultErrorHandler (err, req, res, next) {
  const message =
    req.app.get("env") === "development" ? err.message : "An error occurred";

  res.json({
    status: err.status || "error",
    message: message || null,
    data: err.data,
  });
}

