/**
 * These mock the fetchPage service instead of hitting real network,
 * so the test suite is fast and deterministic (no dependency on
 * example.com being up, slow, or rate-limiting us in CI).
 */
jest.mock("../src/services/fetchPage");

const request = require("supertest");
const { fetchPage } = require("../src/services/fetchPage");
const app = require("../src/server");

describe("POST /api/audit", () => {
  afterEach(() => jest.clearAllMocks());

  test("happy path: returns a full report for a valid HTML page", async () => {
    fetchPage.mockResolvedValue({
      ok: true,
      status: 200,
      responseTimeMs: 120,
      finalUrl: "https://example.com/",
      html: "<html><head><title>Hi</title></head><body><h1>Hi</h1></body></html>",
    });

    const res = await request(app)
      .post("/api/audit")
      .send({ url: "https://example.com" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Hi");
    expect(res.body.h1Count).toBe(1);
  });

  test("failure case: invalid URL is rejected before any fetch happens", async () => {
    const res = await request(app)
      .post("/api/audit")
      .send({ url: "not-a-url" });

    expect(res.status).toBe(400);
    expect(fetchPage).not.toHaveBeenCalled();
  });

  test("failure case: upstream timeout returns 504, not a crash", async () => {
    fetchPage.mockResolvedValue({
      ok: false,
      errorType: "timeout",
      responseTimeMs: 8000,
    });

    const res = await request(app)
      .post("/api/audit")
      .send({ url: "https://slow-site.example" });

    expect(res.status).toBe(504);
    expect(res.body.error).toMatch(/too long/i);
  });

  test("failure case: non-HTML response is rejected with 415", async () => {
    fetchPage.mockResolvedValue({
      ok: false,
      errorType: "non_html_response",
      status: 200,
      responseTimeMs: 90,
      contentType: "application/pdf",
    });

    const res = await request(app)
      .post("/api/audit")
      .send({ url: "https://example.com/file.pdf" });

    expect(res.status).toBe(415);
  });
});
