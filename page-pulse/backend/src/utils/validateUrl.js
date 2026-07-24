/**
 * validateUrl.js
 *
 * Decision: I validate the URL in two passes instead of one regex.
 * Pass 1 checks that it's a well-formed http/https URL (fast, cheap).
 * Pass 2 blocks private/loopback hosts so the tool can't be used to
 * probe internal network addresses (basic SSRF guard). A regex alone
 * would miss this second concern entirely.
 */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
];

function validateUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, reason: "URL is required and must be a string." };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (err) {
    return { valid: false, reason: "That doesn't look like a valid URL." };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, reason: "Only http:// and https:// URLs are supported." };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(hostname)) {
    return { valid: false, reason: "Local/loopback addresses are not allowed." };
  }

  if (PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return { valid: false, reason: "Private network addresses are not allowed." };
  }

  return { valid: true, url: parsed.toString() };
}

module.exports = { validateUrl };
