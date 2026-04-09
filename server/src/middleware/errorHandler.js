function mongoStatusAndMessage(err) {
  if (err.name === "ValidationError") {
    return { status: 400, message: err.message };
  }
  if (err.name === "CastError") {
    return { status: 400, message: "Invalid id" };
  }
  if (err.code === 11000) {
    return { status: 409, message: "Duplicate key" };
  }
  return null;
}

export function errorHandler(err, _req, res, _next) {
  const mongo = mongoStatusAndMessage(err);
  const status = mongo?.status ?? err.status ?? err.statusCode ?? 500;
  const message = mongo?.message
    ? mongo.message
    : status >= 500
      ? "Internal server error"
      : err.message || "Bad request";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
}
