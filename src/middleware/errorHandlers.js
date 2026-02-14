function notFoundHandler(req, res) {
  res.status(404).json({ error: "Route not found." });
}

function errorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && Object.prototype.hasOwnProperty.call(err, "body")) {
    res.status(400).json({ error: "Invalid JSON payload." });
    return;
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ error: err.message || "Internal server error." });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
