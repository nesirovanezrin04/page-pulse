/**
 * analyzePage.js
 *
 * Decision: word count is "approximate" on purpose (the brief asks for
 * that, not exact). I strip <script> and <style> content before counting
 * words, because otherwise minified JS/CSS text gets counted as "words"
 * and wildly inflates the number on script-heavy pages. This is the kind
 * of thing that's obvious once you see a bad result, so I'm noting it
 * here as a deliberate design choice, not an oversight.
 */

const cheerio = require("cheerio");

function analyzePage(html) {
  const $ = cheerio.load(html);

  // Remove non-visible/non-content elements before text analysis.
  $("script, style, noscript").remove();

  const title = $("title").first().text().trim() || null;

  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;

  const h1Elements = $("h1");
  const h1Count = h1Elements.length;
  const h1Texts = h1Elements
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  const images = $("img");
  const totalImages = images.length;
  let imagesMissingAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr("alt");
    // Missing alt attribute OR present-but-empty both count, since an
    // empty alt on a non-decorative image is functionally the same
    // accessibility problem.
    if (alt === undefined || alt.trim() === "") {
      imagesMissingAlt += 1;
    }
  });

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").length : 0;

  return {
    title,
    metaDescription,
    h1Count,
    h1Texts,
    images: {
      total: totalImages,
      missingAlt: imagesMissingAlt,
    },
    approximateWordCount: wordCount,
  };
}

module.exports = { analyzePage };
