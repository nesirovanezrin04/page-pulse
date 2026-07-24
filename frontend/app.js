/**
 * Decision: I point this at a constant I can swap in one place before
 * deploy, rather than hardcoding the URL inline in the fetch call.
 * Set this to your deployed backend URL after you deploy it.
 */
const API_BASE_URL = "https://page-pulse-api-1fzx.onrender.com";

const form = document.getElementById("audit-form");
const input = document.getElementById("url-input");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const report = document.getElementById("report");
const pulseDot = document.querySelector("header h1");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = input.value.trim();
  if (!url) return;

  setLoading(true);
  setStatus("Fetching and analyzing…", "");
  report.classList.add("hidden");

  try {
    const res = await fetch(`${API_BASE_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Something went wrong.", "error");
      return;
    }

    renderReport(data);
    setStatus(`Done in ${data.responseTimeMs}ms.`, "ok");
    retunePulse(data.responseTimeMs);
  } catch (err) {
    // Network failure reaching our own backend (e.g. backend is down),
    // distinct from the backend reporting a failed audit above.
    setStatus("Couldn't reach the Page Pulse server. Is the backend running?", "error");
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Scanning…" : "Audit";
}

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = "status" + (kind ? ` ${kind}` : "");
}

function renderReport(data) {
  document.getElementById("stat-status").textContent = data.httpStatus;
  document.getElementById("stat-time").textContent = `${data.responseTimeMs}ms`;
  document.getElementById("stat-h1").textContent = data.h1Count;
  document.getElementById("stat-words").textContent = data.approximateWordCount;

  const altEl = document.getElementById("stat-alt");
  altEl.textContent = data.images.missingAlt;
  altEl.classList.toggle("flag", data.images.missingAlt > 0);

  document.getElementById("detail-title").textContent = data.title || "— not found —";
  document.getElementById("detail-meta").textContent =
    data.metaDescription || "— not found —";

  report.classList.remove("hidden");
}

// Small signature touch: after a scan, the header's pulse dot beats at a
// speed derived from the page's own response time, so a slow page
// visibly "feels" slow. Purely decorative, capped so it never becomes
// distracting or violates reduced-motion preferences (handled in CSS).
function retunePulse(responseTimeMs) {
  const clamped = Math.min(Math.max(responseTimeMs, 200), 3000);
  const speed = (clamped / 1000).toFixed(2);
  pulseDot.style.setProperty("--pulse-speed", `${speed}s`);
}
