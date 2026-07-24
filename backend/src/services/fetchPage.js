/**
 * fetchPage.js
 *
 * Decision: timeout is implemented with AbortController rather than
 * a setTimeout + Promise.race wrapper. AbortController actually cancels
 * the underlying socket instead of just abandoning the promise, which
 * matters if this endpoint is ever hit repeatedly - we don't want to
 * leak open connections to slow servers.
 */

const fetch = require("node-fetch");

const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;

async function fetchPage(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      follow: MAX_REDIRECTS,
      headers: {
        // Identify the tool honestly instead of spoofing a browser UA.
        "User-Agent": "PagePulseBot/1.0 (+https://digitalheroesco.com)",
      },
    });

    const responseTimeMs = Date.now() - startedAt;
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      return {
        ok: false,
        errorType: "non_html_response",
        status: response.status,
        responseTimeMs,
        contentType,
      };
    }

    const html = await response.text();

    return {
      ok: true,
      status: response.status,
      responseTimeMs,
      html,
      finalUrl: response.url,
    };
  } catch (err) {
    const responseTimeMs = Date.now() - startedAt;

    if (err.name === "AbortError") {
      return { ok: false, errorType: "timeout", responseTimeMs };
    }

    // node-fetch throws FetchError for DNS failures, connection refused, etc.
    return { ok: false, errorType: "network_error", message: err.message, responseTimeMs };
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { fetchPage, TIMEOUT_MS };
