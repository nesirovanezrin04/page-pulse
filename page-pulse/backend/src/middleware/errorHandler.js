/**
 * Catch-all so a bug in any route returns clean JSON instead of Express's
 * default HTML stack trace page. Never want the tool to "crash" visibly.
 */
function errorHandler(err, req, res, next) {
  console.error("[unhandled error]", err);
  res.status(500).json({ error: "Internal server error." });
}

module.exports = { errorHandler };
