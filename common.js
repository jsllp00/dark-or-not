// Shared setup for all three pages.
const CONFIGURED = typeof FIREBASE_CONFIG !== "undefined" && !String(FIREBASE_CONFIG.apiKey).includes("PASTE");
let db = null;
let serverOffset = 0;
if (CONFIGURED) {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.database();
  db.ref(".info/serverTimeOffset").on("value", s => { serverOffset = s.val() || 0; });
}
const now = () => Date.now() + serverOffset;

const DEFAULT_LABELS = { left: "Good nudge", right: "Dark pattern" };

// The four normative lenses from Mathur, Mayer & Kshirsagar (2021).
const LENSES = [
  { name: "Individual welfare", ask: "Does it cost the user money, privacy or time?" },
  { name: "Collective welfare", ask: "Does it harm competition, trust or society?" },
  { name: "Regulatory objectives", ask: "Does it break a rule or law?" },
  { name: "Individual autonomy", ask: "Does it undermine the user's own choice?" }
];
const DEFAULT_TIME = 35;
const POLL_COUNT = 4;
const DEFAULT_POLLS = [
  { type: "scale", q: "Amazon Prime checkout: the big button says “Get FREE Two-Day Shipping” and starts a Prime trial that renews as a paid membership. The small link says “No, I don’t want Free Shipping.” Cancelling took several pages of offers and warnings. Good nudge or dark pattern?" },
  { type: "scale", q: "LinkedIn profile strength meter: your profile shows a meter from Beginner to All-Star, with prompts like “Add a photo,” “Add your skills” and “Add your location.” Each detail you add fills the bar. Good nudge or dark pattern?" },
  { type: "scale", q: "Magazine pricing: web only $59, print only $125, print + web $125. Almost nobody picks print only, but its presence makes print + web look like a bargain. Good nudge or dark pattern?" },
  { type: "choice", q: "Which lens should regulators use to decide what counts as a dark pattern?", options: ["Individual welfare: harm to the user", "Collective welfare: harm to society or the market", "Regulatory objectives: whether it breaks a rule", "Individual autonomy: undermining the user’s own choice"] }
];

function normalizePolls(raw) {
  // Saved polls from an older version (a different number of polls) are ignored.
  if (raw && Object.keys(raw).length !== POLL_COUNT) raw = null;
  const out = [];
  for (let i = 0; i < POLL_COUNT; i++) {
    const d = DEFAULT_POLLS[i], r = (raw && raw[i]) || {};
    out.push({
      type: d.type,
      q: typeof r.q === "string" ? r.q : d.q,
      img: r.img || "",
      time: Number(r.time) > 0 ? Number(r.time) : DEFAULT_TIME,
      options: d.type === "choice" ? (Array.isArray(r.options) && r.options.length ? r.options : d.options).slice() : null
    });
  }
  return out;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function showNotConfigured() {
  document.body.innerHTML = `<div class="gate"><div style="max-width:420px" class="notice">
    <strong>Almost there.</strong> Paste your Firebase settings into <code>firebase-config.js</code>, then reload this page. See README.md, step 3.</div></div>`;
}

// PIN lock for the presenter and editor pages. Calls onOk() once unlocked.
async function requirePin(onOk) {
  if (!CONFIGURED) { showNotConfigured(); return; }
  const snap = await db.ref("config/pinHash").get();
  const stored = snap.val();
  try {
    if (stored && sessionStorage.getItem("dn-pin") === stored) { onOk(); return; }
  } catch (e) {}
  const gate = document.createElement("div");
  gate.className = "gate";
  gate.innerHTML = `<form autocomplete="off">
      <h2>${stored ? "Enter your PIN" : "Create a presenter PIN"}</h2>
      <p class="muted" style="margin:0">${stored ? "This page is for the presenter." : "You'll use this PIN to open the presenter and editor pages. Students never need it."}</p>
      <input class="field mono" id="pin" type="password" inputmode="numeric" minlength="4" placeholder="At least 4 characters" required>
      <button class="btn" type="submit">${stored ? "Unlock" : "Set PIN"}</button>
      <div class="err" id="pinErr" aria-live="polite"></div>
    </form>`;
  document.body.appendChild(gate);
  const input = gate.querySelector("#pin");
  input.focus();
  gate.querySelector("form").addEventListener("submit", async e => {
    e.preventDefault();
    const val = input.value.trim();
    if (val.length < 4) { gate.querySelector("#pinErr").textContent = "Use at least 4 characters."; return; }
    const h = await sha256("dark-or-not:" + val);
    if (stored && h !== stored) { gate.querySelector("#pinErr").textContent = "That PIN doesn't match. Try again."; input.select(); return; }
    if (!stored) await db.ref("config/pinHash").set(h);
    try { sessionStorage.setItem("dn-pin", h); } catch (e) {}
    gate.remove();
    onOk();
  });
}
