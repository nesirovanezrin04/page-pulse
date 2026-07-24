const { analyzePage } = require("../src/services/analyzePage");

describe("analyzePage", () => {
  test("happy path: extracts all fields from a well-formed page", () => {
    const html = `
      <html>
        <head>
          <title>Great Page</title>
          <meta name="description" content="A page about great things.">
        </head>
        <body>
          <h1>Welcome</h1>
          <img src="hero.jpg" alt="hero shot">
          <img src="icon.png" alt="">
          <img src="banner.png">
          <p>This is some readable body copy for the word counter to count.</p>
        </body>
      </html>
    `;

    const result = analyzePage(html);

    expect(result.title).toBe("Great Page");
    expect(result.metaDescription).toBe("A page about great things.");
    expect(result.h1Count).toBe(1);
    expect(result.images.total).toBe(3);
    // one empty alt + one missing alt = 2 flagged
    expect(result.images.missingAlt).toBe(2);
    expect(result.approximateWordCount).toBeGreaterThan(0);
  });

  test("edge case: page with no title, no meta, and no h1", () => {
    const html = `<html><head></head><body><p>Just a paragraph.</p></body></html>`;

    const result = analyzePage(html);

    expect(result.title).toBeNull();
    expect(result.metaDescription).toBeNull();
    expect(result.h1Count).toBe(0);
    expect(result.h1Texts).toEqual([]);
  });

  test("edge case: script/style content is excluded from word count", () => {
    const htmlWithScript = `
      <html><body>
        <p>Three real words here.</p>
        <script>var thisIsALongVariableNameThatWouldInflateCount = true;</script>
        <style>.a-very-long-class-name-here { color: red; }</style>
      </body></html>
    `;
    const htmlWithoutScript = `
      <html><body>
        <p>Three real words here.</p>
      </body></html>
    `;

    const withScript = analyzePage(htmlWithScript);
    const withoutScript = analyzePage(htmlWithoutScript);

    // Word count should be identical whether or not the noisy script/style
    // blocks are present, proving they're stripped before counting.
    expect(withScript.approximateWordCount).toBe(withoutScript.approximateWordCount);
  });

  test("multiple H1s are all counted and captured", () => {
    const html = `<html><body><h1>First</h1><h1>Second</h1></body></html>`;
    const result = analyzePage(html);

    expect(result.h1Count).toBe(2);
    expect(result.h1Texts).toEqual(["First", "Second"]);
  });
});
