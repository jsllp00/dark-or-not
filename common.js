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
const DEFAULT_TIME = 45;
const POLL_COUNT = 7;
const DEFAULT_POLLS = [
  { type: "scale", q: "Checkout upsell: the big button says “Get FREE Two-Day Shipping” and starts a paid membership trial. The small link says “No, I don’t want Free Shipping.” Good nudge or dark pattern?" },
  { type: "scale", q: "Cookie banner: accepting tracking takes one click on “OK.” Declining means “Manage Options” and seven more screens. Good nudge or dark pattern?" },
  { type: "scale", q: "Security prompt: right after you change your password, the site lists every connected app and encourages you to review them. Good nudge or dark pattern?" },
  { type: "scale", q: "Profile strength meter: a bar from Beginner to All-Star, with prompts to add a photo, skills and location. Good nudge or dark pattern?" },
  { type: "scale", q: "Photo privacy label: “Anyone can see this photo” with a green icon; “Only friends and family” with an orange icon. Good nudge or dark pattern?" },
  { type: "scale", q: "Platform redesign: in June 2020 Kickstarter turned its logo black, added #BlackLivesMatter sitewide and highlighted Black creators for nine months. Good nudge or dark pattern?" },
  { type: "choice", q: "What makes a design dark?", options: ["The company’s intent", "The outcome for users", "That it steers you at all"] }
];

function normalizePolls(raw) {
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
