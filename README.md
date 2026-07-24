# Page Pulse

A small tool that audits any URL: fetches the page, reads its HTTP status,
response time, title, meta description, H1 count, image alt-text coverage,
and an approximate word count. Built for the Digital Heroes SDE task kit.

## Stack

- **Backend:** Node.js + Express + Cheerio (HTML parsing) + node-fetch
- **Frontend:** Vanilla HTML/CSS/JS — no framework, no build step

## Setup

### Backend
```bash
cd backend
npm install
npm start          # runs on http://localhost:3001
npm test           # runs the Jest suite
```

### Frontend
Open `frontend/index.html` directly in a browser, or serve it with any
static server. Before deploying, update `API_BASE_URL` at the top of
`frontend/app.js` to point at wherever the backend is deployed.

## API contract

### `POST /api/audit`

**Request body**
```json
{ "url": "https://example.com" }
```

**Success response — `200`**
```json
{
  "requestedUrl": "https://example.com/",
  "finalUrl": "https://example.com/",
  "httpStatus": 200,
  "responseTimeMs": 143,
  "title": "Example Domain",
  "metaDescription": null,
  "h1Count": 1,
  "h1Texts": ["Example Domain"],
  "images": { "total": 0, "missingAlt": 0 },
  "approximateWordCount": 28
}
```

**Error responses**

| Status | When |
|---|---|
| 400 | URL is missing, malformed, or points at a local/private address |
| 415 | The URL didn't return HTML (e.g. a PDF or image) |
| 502 | DNS failure, connection refused, or other network error |
| 504 | The target page didn't respond within 8 seconds |
| 500 | Anything unexpected — always returns clean JSON, never a stack trace |

## Three design decisions, and why

**1. Timeout via `AbortController`, not `Promise.race`.**
A `Promise.race([fetch(url), timeoutPromise])` abandons the losing promise
but doesn't actually cancel the underlying request — the socket stays
open. `AbortController` cancels the real connection. It matters more
here than it looks: this endpoint accepts arbitrary user-supplied URLs,
so a handful of slow or hanging targets could otherwise tie up open
connections indefinitely.

**2. A basic SSRF guard on the URL validator.**
Nothing in the brief asked for this, but the tool's entire job is
"fetch whatever URL a stranger gives you." Without a check, someone
could point it at `http://169.254.169.254` or `http://localhost:PORT`
and use the server as a proxy into its own network. I block loopback,
private IP ranges, and non-http(s) protocols before any fetch is
attempted. It's a small addition, but it's the difference between a
demo tool and one I'd actually be comfortable deploying.

**3. Script/style content is stripped before the word count.**
The brief asks for an "approximate word count," and I initially got
one — just a wildly inflated one, because minified JS and CSS inside
`<script>`/`<style>` tags were being counted as page copy. A page with
a heavy JS bundle was reporting thousands of "words" it doesn't
actually have. Stripping those tags before counting was the fix, and
I added a test (`analyzePage.test.js`) that pins this behavior down so
it can't silently regress.

## What I'd change with another day

The word counter still doesn't distinguish visible text from things
like `aria-hidden` content or `<noscript>` fallbacks. It's a minor
accuracy gap, not a functional bug, but I'd tighten it before calling
this production-ready. I'd also add a small in-memory cache so
auditing the same URL twice in a short window doesn't re-fetch it.

## What I used AI for

I used Claude to scaffold the initial Express route structure and to
think through edge cases for the URL validator (I hadn't initially
considered blocking private IP ranges — that came out of asking "what
could go wrong if a stranger controls the input"). I rewrote the
word-count logic myself after noticing the script-tag inflation bug in
manual testing, and the three design-decision write-ups above are my
own reasoning, not generated summaries.
