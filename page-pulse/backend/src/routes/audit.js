const express = require("express");
const { validateUrl } = require("../utils/validateUrl");
const { fetchPage } = require("../services/fetchPage");
const { analyzePage } = require("../services/analyzePage");

const router = express.Router();

// Decision: this map translates internal error types into HTTP status +
// user-facing messages in one place, so the route handler itself stays
// readable instead of turning into a wall of if/else.
const ERROR_RESPONSES = {
  timeout: { status: 504, message: "The page took too long to respond." },
  network_error: { status: 502, message: "Could not reach that URL." },
  non_html_response: {
    status: 415,
    message: "That URL didn't return an HTML page.",
  },
};

router.post("/audit", async (req, res) => {
  const { url } = req.body;

  const validation = validateUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  const fetchResult = await fetchPage(validation.url);

  if (!fetchResult.ok) {
    const errorInfo =
      ERROR_RESPONSES[fetchResult.errorType] || {
        status: 500,
        message: "Something went wrong while fetching that page.",
      };
    return res.status(errorInfo.status).json({
      error: errorInfo.message,
      status: fetchResult.status ?? null,
      responseTimeMs: fetchResult.responseTimeMs,
    });
  }

  const analysis = analyzePage(fetchResult.html);

  return res.status(200).json({
    requestedUrl: validation.url,
    finalUrl: fetchResult.finalUrl,
    httpStatus: fetchResult.status,
    responseTimeMs: fetchResult.responseTimeMs,
    ...analysis,
  });
});

module.exports = router;
