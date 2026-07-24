const { validateUrl } = require("../src/utils/validateUrl");

describe("validateUrl", () => {
  test("happy path: accepts a well-formed https URL", () => {
    const result = validateUrl("https://example.com/page");
    expect(result.valid).toBe(true);
    expect(result.url).toBe("https://example.com/page");
  });

  test("failure case: rejects a malformed string", () => {
    const result = validateUrl("definitely not a url");
    expect(result.valid).toBe(false);
  });

  test("failure case: rejects non-http(s) protocols", () => {
    const result = validateUrl("ftp://files.example.com");
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/http/i);
  });

  test("rejects loopback and private network addresses (SSRF guard)", () => {
    expect(validateUrl("http://localhost").valid).toBe(false);
    expect(validateUrl("http://127.0.0.1").valid).toBe(false);
    expect(validateUrl("http://192.168.0.5").valid).toBe(false);
    expect(validateUrl("http://10.0.0.1").valid).toBe(false);
  });

  test("rejects empty or non-string input", () => {
    expect(validateUrl("").valid).toBe(false);
    expect(validateUrl(undefined).valid).toBe(false);
    expect(validateUrl(null).valid).toBe(false);
  });
});
