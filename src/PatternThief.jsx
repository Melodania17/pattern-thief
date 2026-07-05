import { useState, useEffect, useRef } from "react";
import { supabase, getCurrentSession, onAuthChange, signOut as authSignOut, getAccessToken } from "./lib/supabase";
import { getFingerprint } from "./lib/fingerprint";
import { fetchUserStatus, fetchSavedCards, saveCardServer, deleteCardServer, bulkMigrateCards } from "./lib/api";
import AuthModal from "./components/AuthModal";
import UpgradeModal from "./components/UpgradeModal";
import AccountPanel from "./components/AccountPanel";
import PatternOfTheDay from "./components/PatternOfTheDay";
import { THEFT_RADIUS_STOPS, RADIUS_PROMPT_GUIDANCE } from "./lib/buildAData";

// ─── DOMAINS (27) ────────────────────────────────────────────────────
const DOMAINS = [
  { id: "nature", label: "Nature & Biomimicry", icon: "🌿", color: "#2d6a4f" },
  { id: "mythology", label: "Mythology & Folklore", icon: "⚡", color: "#c1121f" },
  { id: "literature", label: "Literature & Sci-Fi", icon: "📖", color: "#5a189a" },
  { id: "philosophy", label: "Philosophy & Religion", icon: "🕉️", color: "#8a6d3b" },
  { id: "sports", label: "Sports & Games", icon: "🏟️", color: "#e07a00" },
  { id: "science", label: "Sciences & Math", icon: "🔬", color: "#0077b6" },
  { id: "arts", label: "Music, Art & Architecture", icon: "🎭", color: "#7b2cbf" },
  { id: "history", label: "History & Warfare", icon: "🏛️", color: "#6d4c41" },
  { id: "industry", label: "Cross-Industry", icon: "🏭", color: "#546e7a" },
  { id: "psychology", label: "Psychology & Behavior", icon: "🧠", color: "#d4528a" },
  { id: "economics", label: "Economics & Game Theory", icon: "📊", color: "#00897b" },
  { id: "indigenous", label: "Indigenous & Traditional Knowledge", icon: "🌍", color: "#a0522d" },
  { id: "film", label: "Film, Theater & Storytelling", icon: "🎬", color: "#b71c1c" },
  { id: "culinary", label: "Cooking & Culinary Arts", icon: "🍳", color: "#e65100" },
  { id: "urban", label: "Urban Planning & Transportation", icon: "🏙️", color: "#37474f" },
  { id: "medicine", label: "Medicine & Human Body", icon: "🫀", color: "#ad1457" },
  { id: "technology", label: "Technology & Computing", icon: "💻", color: "#1565c0" },
  { id: "magic", label: "Magic & Illusion", icon: "🎩", color: "#4527a0" },
  { id: "dance", label: "Dance & Performance", icon: "💃", color: "#e91e63" },
  { id: "comedy", label: "Comedy & Humor", icon: "🎤", color: "#f57f17" },
  { id: "crime", label: "Crime & Investigation", icon: "🔍", color: "#3e2723" },
  { id: "ritual", label: "Ritual & Ceremony", icon: "🕯️", color: "#827717" },
  { id: "fashion", label: "Fashion & Textiles", icon: "👗", color: "#880e4f" },
  { id: "agriculture", label: "Gardening & Agriculture", icon: "🌾", color: "#558b2f" },
  { id: "hobby", label: "Hobby & Enthusiast Communities", icon: "🎨", color: "#00695c" },
  { id: "space", label: "Space & Aviation", icon: "🚀", color: "#283593" },
  { id: "emergency", label: "Emergency & Disaster Response", icon: "🚨", color: "#bf360c" },
];

const FEAR_STEPS = [
  { key: "F", name: "Fracture", color: "#e8614d" },
  { key: "E", name: "Examine", color: "#4a90b8" },
  { key: "A", name: "Analogize", color: "#2a9d8f" },
  { key: "R", name: "Reassemble", color: "#d4a843" },
];

const VALID_COUPONS = { "CPSI2026": 5, "THIEF2026": 5 };
const FREE_LIMIT = 5;

// Smart chips — starter prompts with teaser patterns
const STARTER_CHIPS = [
  {
    label: "Standing out in a crowded market",
    prompt: "We're in a crowded market where every competitor says the same things. Our product is genuinely different but customers can't tell us apart from anyone else.",
    teaser: { icon: "🎩", domain: "Magic & illusion", source: "Magicians' misdirection", color: "#4527a0", hint: "Great illusionists don't hide what they're doing — they make you look so intensely at one thing that the real move happens unnoticed elsewhere. What's your industry obsessed with that lets you redirect attention?" }
  },
  {
    label: "Why my team isn't shipping",
    prompt: "Our team is talented but ships way slower than I'd expect. Lots of meetings, lots of planning, but actual output is sluggish. Hiring more hasn't helped.",
    teaser: { icon: "🍳", domain: "Cooking & culinary arts", source: "Restaurant mise en place", color: "#e65100", hint: "Top kitchens spend hours prepping before service so the actual cooking is fast and rhythmic. What 'prep work' is your team skipping that forces them to improvise mid-execution?" }
  },
  {
    label: "What free will actually means",
    prompt: "I've been thinking about free will. Does it really exist, or are we just running deterministic programs we mistake for choice? I'd love to explore this from unexpected angles.",
    teaser: { icon: "🕉️", domain: "Philosophy & religion", source: "The Daoist concept of wu wei", color: "#8a6d3b", hint: "Wu wei means 'effortless action' — acting in such harmony with circumstance that the line between choosing and being chosen by the moment dissolves. What if free will isn't a yes/no question, but a question of how aligned your action is with the present?" }
  },
  {
    label: "Fitting AI into our workflow",
    prompt: "We're trying to figure out how AI should fit into our team's workflow. Everyone's adopting it differently, some are overusing it, some are avoiding it. We need a coherent approach.",
    teaser: { icon: "🌾", domain: "Gardening & agriculture", source: "Companion planting", color: "#558b2f", hint: "In companion planting, certain crops thrive when grown next to specific others — corn supports beans, basil protects tomatoes. The wrong pairing kills both. Which AI tools should sit beside which human roles, and which combinations would quietly poison your team's work?" }
  },
  {
    label: "How to find meaning in tedious work",
    prompt: "My work is necessary but often feels tedious. I'd like to find genuine meaning in it without resorting to motivational quotes or fake reframing.",
    teaser: { icon: "🕯️", domain: "Ritual & ceremony", source: "Japanese tea ceremony (chadō)", color: "#827717", hint: "The Japanese tea ceremony elevates the act of making tea — a tedious daily chore — into a contemplative art by paying extraordinary attention to the smallest gestures. What would happen if you treated the dull parts of your work as if every motion mattered?" }
  },
];


const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');
@keyframes float1{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(12px,-18px) rotate(5deg)}66%{transform:translate(-8px,10px) rotate(-3deg)}}
@keyframes float2{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(-15px,12px) rotate(-4deg)}66%{transform:translate(10px,-14px) rotate(6deg)}}
@keyframes float3{0%,100%{transform:translate(0,0)}50%{transform:translate(8px,-20px)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes ptspin{to{transform:rotate(360deg)}}
@keyframes ptpulse{0%,100%{transform:scale(0.85);opacity:0.5}50%{transform:scale(1.15);opacity:0.9}}
`;

// ─── RANDOMIZATION & ANTI-REPETITION ─────────────────────────────────
// Tracks shown sources across sessions (and shared across users via shared storage)
// so the same pattern doesn't appear twice within a reasonable window.
let userShownSources = [];   // This user's history (persisted)
let globalShownSources = []; // Global recent sources (shared across users, persisted)
const MAX_USER_HISTORY = 150;  // Don't repeat any source shown to this user in the last 150
const MAX_GLOBAL_HISTORY = 80; // Don't repeat any source that ANY recent user got in the last 80

function getRandomDomainPriority() {
  const s = [...DOMAINS].sort(() => Math.random() - 0.5);
  return { full: s.map(d => `${d.id} (${d.label})`).join(", "), mustInclude: s.slice(0, 5).map(d => d.label) };
}

function getAvoidList() {
  const combined = [...new Set([...userShownSources, ...globalShownSources])];
  if (!combined.length) return "";
  return `\n\n=== HARD ANTI-REPETITION RULE (CRITICAL) ===\nThese sources have ALREADY been shown recently: ${combined.join("; ")}.\nDo NOT reuse ANY of them. This includes close variants: if "miso fermentation" is listed, also avoid miso, koji, soy fermentation, and the same underlying example worded differently. Pick genuinely DIFFERENT species, myths, events, people, and works. If you find yourself reaching for a well-known go-to example, assume it has been used and choose something fresher.`;
}

function recordShownSources(cards) {
  if (!cards || !Array.isArray(cards)) return;
  try {
    cards.forEach(c => {
      if (c && c.source_title) {
        if (!userShownSources.includes(c.source_title)) userShownSources.push(c.source_title);
        if (!globalShownSources.includes(c.source_title)) globalShownSources.push(c.source_title);
      }
    });
    // Cap history sizes (keep newest)
    if (userShownSources.length > MAX_USER_HISTORY) userShownSources = userShownSources.slice(-MAX_USER_HISTORY);
    if (globalShownSources.length > MAX_GLOBAL_HISTORY) globalShownSources = globalShownSources.slice(-MAX_GLOBAL_HISTORY);
    // Persist both — fire and forget, never let storage errors break the flow
    storageSet("user-shown-sources", userShownSources).catch(() => {});
    storageSet("global-shown-sources", globalShownSources, true).catch(() => {});
  } catch (e) {
    console.warn("recordShownSources failed (non-fatal):", e);
  }
}

// ─── STORAGE ─────────────────────────────────────────────────────────
let memStore = {};
async function storageGet(key, fallback, shared = false) {
  // Prefer real localStorage — it's the durable source that survives tab close / reload.
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem("pt:" + key);
      if (raw !== null) return JSON.parse(raw);
    }
  } catch {}
  // Secondary: sandboxed window.storage (may be session-scoped)
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(key, shared);
      if (r) return JSON.parse(r.value);
    }
  } catch {}
  return key in memStore ? memStore[key] : fallback;
}
async function storageSet(key, val, shared = false) {
  memStore[key] = val;
  // Always write to real localStorage so it persists across sessions.
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("pt:" + key, JSON.stringify(val));
    }
  } catch (e) { console.error("Storage(local):", e); }
  // Also mirror to sandboxed window.storage if present (best effort).
  try {
    if (typeof window !== "undefined" && window.storage) {
      await window.storage.set(key, JSON.stringify(val), shared);
    }
  } catch (e) { /* non-fatal */ }
}
async function loadSavedCards() { return storageGet("saved-cards", []); }
async function saveSavedCards(cards) { return storageSet("saved-cards", cards); }

// Robust JSON extraction — handles responses with extra commentary, code fences, etc.
function extractJSON(text) {
  // Remove code fences first
  let cleaned = text.replace(/```json|```/g, "").trim();
  // Try parsing directly
  try { return JSON.parse(cleaned); } catch {}
  // Find the first { and matching last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try { return JSON.parse(candidate); } catch {}
  }
  throw new Error("Could not extract valid JSON from response: " + text.slice(0, 200));
}

// ─── API CALLS ───────────────────────────────────────────────────────
// Wraps fetch to /api/anthropic with auth token + browser fingerprint headers.
// Backend uses these to enforce free tier limits and identify Pro users.
async function authenticatedFetch(body) {
  const headers = { "Content-Type": "application/json" };
  try {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {}
  try {
    const fp = await getFingerprint();
    if (fp) headers["X-Fingerprint"] = fp;
  } catch {}
  return fetch("/api/anthropic", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    credentials: "include",
  });
}

async function checkIfNeedsClarification(problem) {
  const r = await authenticatedFetch({ model: "claude-sonnet-4-5", max_tokens: 600,
      system: `Clarifying-question assistant. Decide if problem is specific enough for cross-domain pattern matching. Be LENIENT — full sentence with clear challenge = enough. Max 2 questions, deeply contextual. JSON only: {"needs_clarification":false} or {"needs_clarification":true,"questions":["Q1?","Q2?"]}`,
      messages: [{ role: "user", content: problem }] });
  if (r.status === 402) throw new Error("free_limit_reached");
  if (!r.ok) throw new Error(`API ${r.status}`);
  const txt = (await r.json()).content.filter(b => b.type === "text").map(b => b.text).join("");
  return extractJSON(txt);
}

async function analyzeWithAI(problem, clarifications, radiusKey = "mid") {
  const { full, mustInclude } = getRandomDomainPriority();
  const radiusGuidance = RADIUS_PROMPT_GUIDANCE[radiusKey] || RADIUS_PROMPT_GUIDANCE.mid;
  const r = await authenticatedFetch({ model: "claude-sonnet-4-5", max_tokens: 2500,
      system: `Cross-domain pattern recognition engine. Your job is NOT to generate many cards — your job is to find the FEW BEST cards that will give the user a genuine breakthrough.

${radiusGuidance}

QUALITY BAR — every card MUST meet ALL of these criteria:
1. DISTANCE (governed by the THEFT RADIUS above): respect the radius instruction for how far from the user's own field to reach. Whatever the radius, never give generic, obvious advice from the user's own field.
2. STRUCTURAL FIT: the underlying mechanism of the pattern must directly map to a specific sub-problem the user has. Not loosely thematic — actually structurally similar. If you can't articulate WHY the structure transfers, drop the card.
3. ACTIONABLE STEAL: the_steal must propose something the user could concretely try this week. No abstract insights. No "consider whether..." or "think about how..." — name a specific action or design choice.
4. REAL & VERIFIABLE: only use sources you can confidently confirm exist. No fabrications. If unsure, drop the card. Set precedent to null if no real-world business adaptation is known.

PROCESS:
1. FRACTURE: identify 2-3 core sub-problems. Use the user's exact words where possible.

VOICE — IMPORTANT:
- Write the fracture_summary and the_analogy in SECOND PERSON, addressing the user directly. Use "you," "your," "you've," "you asked about..." — never "the user" or "they" or third person. Example: "You asked about retaining engineers — your real challenge is that growth means promotion, but they want creative authority." NOT: "The user is asking about engineer retention. They are facing..."
- Mirror their words and phrasing back to them.
2. For each sub-problem, search across these 27 domains (randomized priority): ${full}
3. MUST include 2+ cards from: ${mustInclude.join(", ")}.
4. Generate ONLY 3-4 cards total. Quality beats quantity. If only 3 strong cards exist, return 3.

Avoid overused examples: Disney, Apple, Toyota/Kaizen, honeybees/ant colonies, Ferrari pit stops, Amazon, Netflix, Sun Tzu.${getAvoidList()}

Field requirements (be concise):
- source_title: specific (named species, myth, principle, event, work — not generic categories)
- the_pattern: 1-2 sentences explaining the mechanism in plain English, no jargon
- the_analogy: 1 sentence tying it to the user's specific framing (use their words)
- the_steal: 1 provocative, concrete sentence proposing what the user could try
- precedent: a real example of someone applying this in business, or null
- go_deeper_prompt: 1-sentence AI prompt for deeper exploration

JSON only (no commentary before or after):
{"fracture_summary":"...","sub_problems":["..."],"cards":[{"sub_problem":"...","domain":"id","domain_label":"...","source_title":"...","the_pattern":"...","the_analogy":"...","the_steal":"...","precedent":"... or null","go_deeper_prompt":"..."}]}`,
      messages: [{ role: "user", content: problem + (clarifications?.length ? `\n\nCONTEXT:\n${clarifications.join("\n")}` : "") }] });
  if (r.status === 402) throw new Error("free_limit_reached");
  if (!r.ok) throw new Error(`API ${r.status}`);
  const data = await r.json();
  const txt = data.content.filter(b => b.type === "text").map(b => b.text).join("");
  const p = extractJSON(txt);
  if (data._is_preview) p._is_preview = true;
  recordShownSources(p.cards); return p;
}

async function exploreDeeper(card, originalProblem) {
  const r = await authenticatedFetch({ model: "claude-sonnet-4-5", max_tokens: 1500,
      system: `Expert analyst. Explore how a cross-domain pattern applies to a specific problem. Structure: 1. PATTERN IN DEPTH (2-3 sent) 2. HOW IT MAPS (2-3 sent specific) 3. THREE IDEAS (2 sent each, escalating) 4. WATCH OUT (1-2 sent). Under 300 words. Direct.`,
      messages: [{ role: "user", content: `PROBLEM: ${originalProblem}\nPATTERN: ${card.domain_label} — ${card.source_title}\n${card.the_pattern}\nConnection: ${card.the_analogy}\nSteal: ${card.the_steal}\n\nApply this to my situation.` }] });
  if (r.status === 402) throw new Error("free_limit_reached");
  if (!r.ok) throw new Error(`API ${r.status}`);
  return (await r.json()).content.filter(b => b.type === "text").map(b => b.text).join("");
}

// ─── EXPORT ──────────────────────────────────────────────────────────
function generateMarkdown(cards) {
  let md = `# Pattern Thief — Saved Cards\n\n`;
  cards.forEach((c, i) => {
    const d = DOMAINS.find(dm => dm.id === c.domain);
    md += `## ${i + 1}. ${c.source_title}\n**Domain:** ${d?.icon || ""} ${c.domain_label}\n`;
    if (c.original_problem) md += `**Original problem:** ${c.original_problem}\n`;
    md += `**Addresses:** ${c.sub_problem}\n\n### The Pattern\n${c.the_pattern}\n\n### The Connection\n${c.the_analogy}\n\n### The Steal\n${c.the_steal}\n\n`;
    if (c.precedent) md += `**Already stolen by:** ${c.precedent}\n\n`;
    md += `---\n\n`;
  });
  return md;
}
function downloadSavedCards(cards, setExportStatus) {
  const md = generateMarkdown(cards);
  const filename = `pattern-thief-saved-${new Date().toISOString().slice(0, 10)}.md`;

  // Try file download first (works on deployed sites)
  try {
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (setExportStatus) { setExportStatus("downloaded"); setTimeout(() => setExportStatus(null), 3000); }
    return;
  } catch (e) { console.warn("File download blocked, falling back to clipboard"); }

  // Fallback: clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).then(() => {
      if (setExportStatus) { setExportStatus("copied"); setTimeout(() => setExportStatus(null), 3000); }
    }).catch(() => {
      if (setExportStatus) { setExportStatus("error"); setTimeout(() => setExportStatus(null), 3000); }
    });
  } else {
    if (setExportStatus) { setExportStatus("error"); setTimeout(() => setExportStatus(null), 3000); }
  }
}

// ─── GO DEEPER MODAL ─────────────────────────────────────────────────
function GoDeeperModal({ card, originalProblem, onClose }) {
  const [exploring, setExploring] = useState(false);
  const [exploration, setExploration] = useState(null);
  const [error, setError] = useState(null);
  const d = DOMAINS.find(dm => dm.id === card.domain) || DOMAINS[8];
  const handleExplore = async () => { setExploring(true); setError(null); try { setExploration(await exploreDeeper(card, originalProblem)); } catch { setError("Couldn't explore right now. Please try again."); } finally { setExploring(false); } };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#18181f", border: `1px solid ${d.color}40`, borderRadius: "20px", padding: "32px", maxWidth: "620px", width: "100%", position: "relative", maxHeight: "88vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "32px", height: "32px", color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: `${d.color}35`, border: `1px solid ${d.color}70`, borderRadius: "6px", padding: "4px 10px", marginBottom: "20px" }}>
          <span style={{ fontSize: "14px" }}>{d.icon}</span>
          <span style={{ fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#fff" }}>{card.domain_label}</span>
        </div>
        <h2 style={{ fontFamily: "'Lato'", fontSize: "22px", fontWeight: 900, color: "#f5f5f5", marginBottom: "8px", lineHeight: 1.3 }}>{card.source_title}</h2>
        <p style={{ fontFamily: "'Lato'", fontSize: "14px", color: "rgba(255,255,255,0.5)", marginBottom: "24px" }}>{card.the_pattern}</p>
        {!exploration && !exploring && <button onClick={handleExplore} style={{ width: "100%", padding: "15px", background: `linear-gradient(135deg, ${d.color}cc, ${d.color}88)`, color: "#fff", border: "none", borderRadius: "10px", fontFamily: "'Lato'", fontSize: "13px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer", boxShadow: `0 4px 16px ${d.color}30` }}>Explore This Pattern Now</button>}
        {exploring && <div style={{ textAlign: "center", padding: "30px 0" }}><div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `conic-gradient(${d.color},transparent)`, animation: "ptspin 1s linear infinite", opacity: 0.5, margin: "0 auto 14px" }} /><p style={{ fontFamily: "'Lato'", fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>Exploring this pattern...</p></div>}
        {error && <div style={{ background: "rgba(232,97,77,0.08)", border: "1px solid rgba(232,97,77,0.2)", borderRadius: "10px", padding: "14px", marginTop: "12px" }}><p style={{ fontFamily: "'Lato'", fontSize: "13px", color: "#e8614d" }}>{error}</p></div>}
        {exploration && <div style={{ animation: "fadeUp 0.4s ease" }}><div style={{ fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: d.color, marginBottom: "12px" }}>Deep Exploration</div><div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px", fontFamily: "'Lato'", fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{exploration}</div></div>}
      </div>
    </div>
  );
}

// ─── UPGRADE MODAL is now imported from ./components/UpgradeModal ───

// ─── INFO MODAL ──────────────────────────────────────────────────────
function InfoModal({ onClose }) {
  const [showDomains, setShowDomains] = useState(false);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "36px", maxWidth: "560px", width: "100%", position: "relative", maxHeight: "85vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "32px", height: "32px", color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        <h2 style={{ fontFamily: "'Lato'", fontSize: "28px", fontWeight: 900, color: "#f1f1f1", marginBottom: "20px" }}>How Pattern Thief Works</h2>
        <div style={{ fontFamily: "'Lato'", fontSize: "15px", color: "rgba(255,255,255,0.7)", lineHeight: 1.75 }}>
          <p style={{ marginBottom: "16px" }}>
            This tool is not designed to give you answers. It is designed to give you unexpected connections and starting points. Pattern Thief scans{" "}
            <button onClick={() => setShowDomains(!showDomains)} style={{ background: "none", border: "none", padding: 0, fontFamily: "'Lato'", fontSize: "15px", fontWeight: 700, color: "#d4a843", cursor: "pointer", borderBottom: "1px dashed rgba(212,168,67,0.5)" }}>
              27 domains {showDomains ? "▲" : "▼"}
            </button>
            {" "}to look for unique structural patterns that closely parallel your specific challenge.
          </p>
          {showDomains && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,168,67,0.15)", borderRadius: "12px", padding: "16px", marginBottom: "20px", animation: "fadeUp 0.3s ease" }}>
              <div style={{ fontFamily: "'Lato'", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#d4a843", marginBottom: "10px" }}>Domains Searched</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {DOMAINS.map(d => <span key={d.id} style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: `${d.color}25`, color: d.color, border: `1px solid ${d.color}40`, fontFamily: "'Lato'", fontWeight: 700, whiteSpace: "nowrap" }}>{d.icon} {d.label}</span>)}
              </div>
            </div>
          )}
          <h3 style={{ fontFamily: "'Lato'", fontSize: "20px", fontWeight: 900, color: "#f1f1f1", marginBottom: "10px" }}>What Pattern Thief Is Best For</h3>
          <ul style={{ marginBottom: "18px", paddingLeft: "18px", fontSize: "14px" }}>
            {["Stuck problems — conventional solutions have failed","Differentiation — when everyone looks alike","Human behavior puzzles — logic doesn't match behavior","Ambiguous challenges — no obvious playbook","Reframing moments — thinking about this wrong","Brand & storytelling — where metaphor matters","Innovation briefs — when different beats optimized"].map(t => <li key={t} style={{ marginBottom: "6px" }}>{t}</li>)}
          </ul>
          <p style={{ fontSize: "13px", fontStyle: "italic", color: "rgba(255,255,255,0.45)", marginBottom: "20px" }}>Less useful for: technical debugging, compliance, financial modeling, or real-time data needs.</p>
          <p>Ultimately, even if you don't end up using the ideas presented, you will enjoy the process of discovery, and learning about new and unique fields and disciplines.</p>
        </div>
      </div>
    </div>
  );
}

// ─── FLOATING ICONS ──────────────────────────────────────────────────
function FloatingIcons() {
  // Positioned toward the left/right edges (the empty gutters on desktop), kept subtle
  // so they never overwhelm the centered text. Mobile naturally clips the far edges.
  const ps=[
    {top:"6%",left:"2%",a:"float1",d:"18s",s:"52px",o:0.16},
    {top:"12%",right:"3%",a:"float2",d:"22s",s:"56px",o:0.15},
    {top:"30%",left:"1%",a:"float3",d:"20s",s:"48px",o:0.14},
    {top:"48%",right:"2%",a:"float1",d:"25s",s:"54px",o:0.16},
    {top:"66%",left:"3%",a:"float2",d:"19s",s:"50px",o:0.15},
    {top:"82%",right:"3%",a:"float3",d:"23s",s:"48px",o:0.14},
    {top:"20%",left:"6%",a:"float1",d:"21s",s:"44px",o:0.12},
    {top:"58%",right:"6%",a:"float2",d:"17s",s:"46px",o:0.13},
    {top:"88%",left:"7%",a:"float3",d:"24s",s:"42px",o:0.12},
    {top:"38%",right:"7%",a:"float1",d:"20s",s:"44px",o:0.12},
    {top:"74%",left:"1%",a:"float2",d:"26s",s:"50px",o:0.14},
    {top:"4%",right:"8%",a:"float3",d:"18s",s:"42px",o:0.11},
  ];
  return <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>{DOMAINS.slice(0,12).map((d,i)=>{const p=ps[i];return <span key={d.id} style={{position:"absolute",top:p.top,left:p.left,right:p.right,fontSize:p.s,opacity:p.o,animation:`${p.a} ${p.d} ease-in-out infinite`}}>{d.icon}</span>;})}</div>;
}

function FEARBar({ activeStep }) {
  return <div style={{display:"flex",gap:"3px",width:"100%",marginBottom:"10px"}}>{FEAR_STEPS.map((s,i)=><div key={s.key} style={{flex:1,textAlign:"center"}}><div style={{height:"3px",width:"100%",borderRadius:"2px",background:i<=activeStep?s.color:"rgba(255,255,255,0.06)"}} /><span style={{fontFamily:"'Lato'",fontSize:"10px",fontWeight:700,color:i<=activeStep?s.color:"rgba(255,255,255,0.15)",letterSpacing:"0.5px"}}>{s.key}·{s.name}</span></div>)}</div>;
}

// ─── SHARE MODAL ─────────────────────────────────────────────────────
function ShareModal({ card, onClose, onImageSaved }) {
  const [copied, setCopied] = useState(false);
  const [imageStatus, setImageStatus] = useState(null);
  const d = DOMAINS.find(dm => dm.id === card.domain) || DOMAINS[8];

  const formatSnippet = () => {
    return `${d.icon} ${card.domain_label.toUpperCase()}\n\n${card.source_title}\n\n${card.the_pattern}\n\n→ THE CONNECTION\n${card.the_analogy}\n\n⚡ THE STEAL\n${card.the_steal}\n\n— via Pattern Thief (PatternThief.com)`;
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(formatSnippet()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSaveImage = async () => {
    setImageStatus("generating");
    try {
      const W = 1080;
      const H = 1350;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, "#0c0c11");
      bgGrad.addColorStop(0.5, "#18181f");
      bgGrad.addColorStop(1, "#14141a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle radial accents
      const radial1 = ctx.createRadialGradient(W - 100, 80, 0, W - 100, 80, 280);
      radial1.addColorStop(0, "rgba(212,168,67,0.10)");
      radial1.addColorStop(1, "rgba(212,168,67,0)");
      ctx.fillStyle = radial1;
      ctx.fillRect(0, 0, W, H);

      const radial2 = ctx.createRadialGradient(80, H - 80, 0, 80, H - 80, 300);
      radial2.addColorStop(0, "rgba(45,106,79,0.08)");
      radial2.addColorStop(1, "rgba(45,106,79,0)");
      ctx.fillStyle = radial2;
      ctx.fillRect(0, 0, W, H);

      // Text wrapping helper
      const wrapText = (text, maxWidth, fontSpec) => {
        ctx.font = fontSpec;
        const words = text.split(" ");
        const lines = [];
        let current = "";
        for (const w of words) {
          const test = current ? current + " " + w : w;
          if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = w;
          } else {
            current = test;
          }
        }
        if (current) lines.push(current);
        return lines;
      };

      // Header: brand
      ctx.fillStyle = "#f5f5f5";
      ctx.font = "900 36px Lato, Arial, sans-serif";
      ctx.fillText("Pattern Thief", 80, 100);

      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "400 16px Lato, Arial, sans-serif";
      ctx.fillText("CROSS-DOMAIN PATTERN RECOGNITION", 80, 132);

      // Accent line top-right
      const accentGrad = ctx.createLinearGradient(W - 160, 0, W - 80, 0);
      accentGrad.addColorStop(0, "#e8614d");
      accentGrad.addColorStop(0.5, "#d4a843");
      accentGrad.addColorStop(1, "#2a9d8f");
      ctx.fillStyle = accentGrad;
      ctx.beginPath();
      ctx.roundRect(W - 160, 108, 80, 4, 2);
      ctx.fill();

      // Domain badge
      const domainText = card.domain_label.toUpperCase();
      ctx.font = "700 20px Lato, Arial, sans-serif";
      const badgeTextWidth = ctx.measureText(domainText).width;
      const badgeWidth = badgeTextWidth + 50;
      ctx.fillStyle = d.color + "59";
      ctx.beginPath();
      ctx.roundRect(80, 200, badgeWidth, 48, 8);
      ctx.fill();
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(80, 200, badgeWidth, 48, 8);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 20px Lato, Arial, sans-serif";
      ctx.fillText(domainText, 100, 232);

      // Large domain emoji on the right — a subtle visual signal of the source domain
      // Drawn at lower opacity so it doesn't overpower the text
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.font = "240px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(d.icon, W - 60, 280);
      ctx.restore();
      ctx.textAlign = "left"; // reset for subsequent text

      // Source title (large, bold)
      let y = 320;
      const sourceLines = wrapText(card.source_title, W - 160, "900 50px Lato, Arial, sans-serif");
      ctx.fillStyle = "#f5f5f5";
      ctx.font = "900 50px Lato, Arial, sans-serif";
      sourceLines.forEach(line => {
        ctx.fillText(line, 80, y);
        y += 60;
      });
      y += 20;

      // Pattern text
      const patternLines = wrapText(card.the_pattern, W - 160, "400 26px Lato, Arial, sans-serif");
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.font = "400 26px Lato, Arial, sans-serif";
      patternLines.forEach(line => {
        ctx.fillText(line, 80, y);
        y += 38;
      });
      y += 40;

      // Connection section
      ctx.fillStyle = "#2a9d8f";
      ctx.font = "700 18px Lato, Arial, sans-serif";
      ctx.fillText("THE CONNECTION", 80, y);
      y += 36;

      const connLines = wrapText(card.the_analogy, W - 160, "400 24px Lato, Arial, sans-serif");
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = "400 24px Lato, Arial, sans-serif";
      connLines.forEach(line => {
        ctx.fillText(line, 80, y);
        y += 36;
      });
      y += 30;

      // The Steal box
      const stealLines = wrapText(card.the_steal, W - 200, "400 24px Lato, Arial, sans-serif");
      const boxHeight = stealLines.length * 36 + 90;
      ctx.fillStyle = "rgba(212,168,67,0.07)";
      ctx.beginPath();
      ctx.roundRect(60, y, W - 120, boxHeight, 14);
      ctx.fill();
      ctx.strokeStyle = "rgba(212,168,67,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(60, y, W - 120, boxHeight, 14);
      ctx.stroke();

      ctx.fillStyle = "#d4a843";
      ctx.font = "700 18px Lato, Arial, sans-serif";
      ctx.fillText("THE STEAL", 80, y + 38);

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "400 24px Lato, Arial, sans-serif";
      let stealY = y + 72;
      stealLines.forEach(line => {
        ctx.fillText(line, 80, stealY);
        stealY += 36;
      });

      // Footer line
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, H - 100);
      ctx.lineTo(W - 80, H - 100);
      ctx.stroke();

      // Footer text
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "400 18px Lato, Arial, sans-serif";
      ctx.fillText("via PatternThief.com", 80, H - 60);

      ctx.fillStyle = "rgba(212,168,67,0.7)";
      ctx.font = "700 16px Lato, Arial, sans-serif";
      const ctaText = "FIND YOUR OWN";
      const ctaWidth = ctx.measureText(ctaText).width;
      ctx.fillText(ctaText, W - 80 - ctaWidth, H - 60);

      // Convert canvas to blob and download
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `pattern-thief-${card.source_title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          setImageStatus("saved");
          if (onImageSaved) onImageSaved();
          setTimeout(() => setImageStatus(null), 2500);
        } else {
          setImageStatus("error");
          setTimeout(() => setImageStatus(null), 2500);
        }
      }, "image/png");
    } catch (e) {
      console.error("Image generation error:", e);
      setImageStatus("error");
      setTimeout(() => setImageStatus(null), 2500);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "28px", maxWidth: "400px", width: "100%", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "32px", height: "32px", color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        <h3 style={{ fontFamily: "'Lato'", fontSize: "20px", fontWeight: 900, color: "#f5f5f5", marginBottom: "4px" }}>Share this pattern</h3>
        <p style={{ fontFamily: "'Lato'", fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "20px" }}>Spread the wonder. Every share helps someone find Pattern Thief.</p>

        <button onClick={handleSaveImage} disabled={imageStatus === "generating"} style={{ width: "100%", background: imageStatus === "saved" ? "rgba(45,202,165,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${imageStatus === "saved" ? "rgba(45,202,165,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: "12px", padding: "14px 16px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "14px", cursor: imageStatus === "generating" ? "wait" : "pointer", textAlign: "left", fontFamily: "'Lato'", transition: "all 0.2s" }}
          onMouseEnter={e => { if (!imageStatus) e.currentTarget.style.borderColor = "rgba(212,168,67,0.4)"; }}
          onMouseLeave={e => { if (!imageStatus) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(212,168,67,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#d4a843", fontSize: "16px", flexShrink: 0 }}>📸</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Lato'", fontSize: "14px", fontWeight: 700, color: "#f5f5f5" }}>
              {imageStatus === "generating" ? "Generating..." : imageStatus === "saved" ? "✓ Image saved" : imageStatus === "error" ? "Couldn't generate — try snippet" : "Save as image"}
            </div>
            <div style={{ fontFamily: "'Lato'", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Beautiful PNG for LinkedIn, X, Instagram</div>
          </div>
        </button>

        <button onClick={handleCopySnippet} style={{ width: "100%", background: copied ? "rgba(45,202,165,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${copied ? "rgba(45,202,165,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", textAlign: "left", fontFamily: "'Lato'", transition: "all 0.2s" }}
          onMouseEnter={e => { if (!copied) e.currentTarget.style.borderColor = "rgba(212,168,67,0.4)"; }}
          onMouseLeave={e => { if (!copied) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(212,168,67,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#d4a843", fontSize: "16px", flexShrink: 0 }}>📋</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Lato'", fontSize: "14px", fontWeight: 700, color: "#f5f5f5" }}>{copied ? "✓ Copied to clipboard" : "Copy as snippet"}</div>
            <div style={{ fontFamily: "'Lato'", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Formatted text for Slack, Notion, email</div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── PATTERN CARD ────────────────────────────────────────────────────
function PatternCard({ card, index, isVisible, onGoDeeper, onSave, isSaved, onRemove, showRemove, blurred, onShare, canGoDeeper = true, onLockedClick }) {
  const [flipped, setFlipped] = useState(false);
  const [fH, setFH] = useState(0);
  const [bH, setBH] = useState(0);
  const fRef = useRef(null);
  const bRef = useRef(null);
  const d = DOMAINS.find(dm => dm.id === card.domain) || DOMAINS[8];
  useEffect(() => { if (fRef.current) setFH(fRef.current.scrollHeight); if (bRef.current) setBH(bRef.current.scrollHeight); }, [card]);
  const h = Math.max(flipped ? bH : fH, 260);

  return (
    <div style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`, perspective: "1200px", cursor: blurred ? "default" : "pointer", WebkitTapHighlightColor: "transparent", position: "relative" }}
      onClick={() => !blurred && setFlipped(!flipped)}>
      <div style={{ position: "relative", transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0)", transition: "transform 0.55s ease, height 0.35s ease", height: `${h}px` }}>
        {/* FRONT */}
        <div ref={fRef} style={{ position: "absolute", top: 0, left: 0, right: 0, backfaceVisibility: "hidden", background: "linear-gradient(145deg, #16161c, #1c1c24)", border: `1px solid ${d.color}45`, borderRadius: "16px", padding: "22px 24px", display: "flex", flexDirection: "column", boxShadow: `0 0 0 1px ${d.color}10, 0 12px 40px rgba(0,0,0,0.5)`, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: `${d.color}40`, border: `1px solid ${d.color}90`, borderRadius: "6px", padding: "5px 11px" }}>
              <span style={{ fontSize: "14px" }}>{d.icon}</span>
              <span style={{ fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "#fff" }}>{card.domain_label}</span>
            </div>
            {!blurred && (showRemove ? (
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={e => { e.stopPropagation(); onShare(card); }} title="Share" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.4)"; e.currentTarget.style.color = "#d4a843"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>Share</button>
                <button onClick={e => { e.stopPropagation(); onRemove(card); }} style={{ background: "rgba(232,97,77,0.1)", border: "1px solid rgba(232,97,77,0.3)", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, color: "#e8614d" }}>Remove</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button onClick={e => { e.stopPropagation(); onShare(card); }} title="Share" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.4)"; e.currentTarget.style.color = "#d4a843"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>Share</button>
                <button onClick={e => { e.stopPropagation(); onSave(card); }} title={isSaved ? "Saved" : "Save card"} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", transition: "transform 0.2s", transform: isSaved ? "scale(1.1)" : "scale(1)", filter: isSaved ? "none" : "grayscale(1) brightness(0.5)", padding: 0 }}>🔖</button>
              </div>
            ))}
          </div>
          <h3 style={{ fontFamily: "'Lato'", fontSize: "20px", fontWeight: 900, color: "#f5f5f5", lineHeight: 1.3, marginBottom: "14px" }}>{card.source_title}</h3>
          <div style={{ position: "relative" }}>
            <p style={{ fontFamily: "'Lato'", fontSize: "14.5px", color: "rgba(255,255,255,0.68)", lineHeight: 1.65, filter: blurred ? "blur(7px)" : "none", userSelect: blurred ? "none" : "auto", transition: "filter 0.3s ease" }}>{card.the_pattern}</p>
            {blurred && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ background: "rgba(24,24,31,0.85)", border: "1px solid rgba(212,168,67,0.4)", borderRadius: "10px", padding: "10px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", pointerEvents: "auto" }}>
                  <span style={{ fontSize: "16px" }}>🔒</span>
                  <span style={{ fontFamily: "'Lato'", fontSize: "11px", fontWeight: 700, color: "#d4a843", textTransform: "uppercase", letterSpacing: "1px" }}>Unlock to see the full pattern</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px", filter: blurred ? "blur(5px)" : "none" }}>
            <span style={{ fontFamily: "'Lato'", fontSize: "12px", color: "rgba(255,255,255,0.25)", maxWidth: "65%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.sub_problem}</span>
            <span style={{ fontFamily: "'Lato'", fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "2.5px", background: `${d.color}55`, borderRadius: "5px", padding: "4px 14px" }}>FLIP →</span>
          </div>
        </div>
        {/* BACK */}
        <div ref={bRef} style={{ position: "absolute", top: 0, left: 0, right: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(145deg, #1a1a22, #1e1e28)", border: `1px solid ${d.color}65`, borderRadius: "16px", padding: "22px 24px", display: "flex", flexDirection: "column", boxShadow: `0 0 0 1px ${d.color}15, 0 12px 40px rgba(0,0,0,0.5)` }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, color: "#2a9d8f", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "7px" }}>The Connection</div>
            <p style={{ fontFamily: "'Lato'", fontSize: "15px", color: "rgba(255,255,255,0.88)", lineHeight: 1.6 }}>{card.the_analogy}</p>
          </div>
          <div style={{ background: "rgba(212,168,67,0.08)", borderRadius: "10px", padding: "13px 15px", border: "1px solid rgba(212,168,67,0.2)", marginBottom: "14px" }}>
            <div style={{ fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, color: "#d4a843", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "5px" }}>⚡ The Steal</div>
            <p style={{ fontFamily: "'Lato'", fontSize: "15px", color: "rgba(255,255,255,0.92)", lineHeight: 1.55 }}>{card.the_steal}</p>
          </div>
          {card.precedent && <div style={{ marginBottom: "14px", paddingLeft: "12px", borderLeft: `2px solid ${d.color}60` }}><div style={{ fontFamily: "'Lato'", fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Already stolen by</div><p style={{ fontFamily: "'Lato'", fontSize: "13px", color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>{card.precedent}</p></div>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginTop: "18px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
            <button onClick={e => { e.stopPropagation(); if (canGoDeeper) onGoDeeper(card); else if (onLockedClick) onLockedClick(); }}
              title={canGoDeeper ? "Go Deeper" : "Available with Pro — tap to learn more"}
              style={{ background: canGoDeeper ? `${d.color}35` : "rgba(255,255,255,0.04)", borderRadius: "6px", padding: "7px 14px", border: canGoDeeper ? `1px solid ${d.color}80` : "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontFamily: "'Lato'", fontSize: "11px", fontWeight: 700, color: canGoDeeper ? "#fff" : "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", opacity: canGoDeeper ? 1 : 0.7 }}
              onMouseEnter={e => { if (canGoDeeper) e.currentTarget.style.background = `${d.color}55`; }} onMouseLeave={e => { if (canGoDeeper) e.currentTarget.style.background = `${d.color}35`; }}>
              {canGoDeeper ? "Go Deeper" : "🔒 Go Deeper"}
            </button>
            <span style={{ fontFamily: "'Lato'", fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "2.5px", background: `${d.color}55`, borderRadius: "5px", padding: "4px 14px" }}>← FLIP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSequence({ text }) {
  // Dramatic, non-repeating "someone is actually thinking" sequence.
  // Shuffled once per load so it feels alive, and it never repeats a line in a run.
  const pool = [
    "Fracturing your problem into its real tensions",
    "Hmm. The obvious answer is right there… ignoring it",
    "Reaching past your own industry on purpose",
    "Rifling through ornithology, ritual, deep biology…",
    "That one's too clever to be useful. Dropping it",
    "Wait — there's something in an unexpected corner",
    "Ooh. That's quite profound… let me pull the thread",
    "No, no — nobody would think to look here. Perfect",
    "Testing whether this pattern actually maps to you",
    "Almost. Let me find something a little more mind-bending",
    "Yes. That's the steal — reassembling it for you",
  ];
  const [order] = useState(() => {
    const a = [...pool];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    // Keep the first (fracture) and last (steal) anchored for narrative arc
    return ["Fracturing your problem into its real tensions", ...a.filter(x => x !== "Fracturing your problem into its real tensions" && x !== "Yes. That's the steal — reassembling it for you"), "Yes. That's the steal — reassembling it for you"];
  });
  const [c, setC] = useState(0);
  const [dots, setDots] = useState("");
  const barStep = Math.min(Math.floor((c / order.length) * 4), 3);
  useEffect(() => {
    const m = setInterval(() => setC(p => Math.min(p + 1, order.length - 1)), 2100);
    const d = setInterval(() => setDots(p => p.length >= 3 ? "" : p + "."), 450);
    return () => { clearInterval(m); clearInterval(d); };
  }, [order.length]);
  const color = FEAR_STEPS[barStep]?.color || "#d4a843";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: "26px" }}>
      <FEARBar activeStep={barStep} />
      {/* Layered thinking visual: pulsing core + orbiting spark */}
      <div style={{ position: "relative", width: "88px", height: "88px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle, ${color}33, transparent 70%)`, animation: "ptpulse 2s ease-in-out infinite" }} />
        <div style={{ width: "58px", height: "58px", borderRadius: "50%", border: `2px solid ${color}`, borderTopColor: "transparent", borderRightColor: "transparent", animation: "ptspin 1.1s linear infinite", opacity: 0.7 }} />
        <div style={{ position: "absolute", width: "10px", height: "10px", borderRadius: "50%", background: color, top: "6px", left: "50%", transform: "translateX(-50%)", animation: "ptspin 1.6s linear infinite", transformOrigin: "50% 38px", boxShadow: `0 0 10px ${color}` }} />
      </div>
      <p key={c} style={{ fontFamily: "'Lato'", fontSize: "16px", fontWeight: 400, color: "rgba(255,255,255,0.72)", textAlign: "center", minHeight: "24px", maxWidth: "400px", lineHeight: 1.5, animation: "fadeUp 0.4s ease" }}>
        {text || order[c]}{dots}
      </p>
    </div>
  );
}

// ─── SAVED CARDS VIEW ────────────────────────────────────────────────
function SavedCardsView({ savedCards, onGoDeeper, onRemove, onClose, onShare, canGoDeeper, onLockedClick }) {
  const [exportStatus, setExportStatus] = useState(null);
  return (
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontFamily: "'Lato'", fontSize: "13px", cursor: "pointer", marginBottom: "24px", padding: 0 }}>← Back</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <h2 style={{ fontFamily: "'Lato'", fontSize: "28px", fontWeight: 900, color: "#f5f5f5" }}>Saved Cards</h2>
        {savedCards.length > 0 && (
          <button onClick={() => downloadSavedCards(savedCards, setExportStatus)} style={{
            background: exportStatus ? "rgba(42,157,143,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${exportStatus ? "rgba(42,157,143,0.4)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontFamily: "'Lato'", fontSize: "11px", fontWeight: 700,
            color: exportStatus ? "#2a9d8f" : "rgba(255,255,255,0.4)",
            letterSpacing: "0.5px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s" }}
            onMouseEnter={e => { if (!exportStatus) { e.currentTarget.style.borderColor = "rgba(212,168,67,0.4)"; e.currentTarget.style.color = "#d4a843"; } }}
            onMouseLeave={e => { if (!exportStatus) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; } }}>
            {exportStatus === "downloaded" ? "✓ Downloaded" : exportStatus === "copied" ? "✓ Copied to clipboard" : exportStatus === "error" ? "Export failed" : "↓ Export All"}
          </button>
        )}
      </div>
      <p style={{ fontFamily: "'Lato'", fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "28px" }}>
        {savedCards.length} pattern{savedCards.length !== 1 ? "s" : ""} saved for reference
      </p>
      {savedCards.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontFamily: "'Lato'", fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>🔖</p>
          <p style={{ fontFamily: "'Lato'", fontSize: "16px", color: "rgba(255,255,255,0.3)" }}>No saved cards yet.</p>
          <p style={{ fontFamily: "'Lato'", fontSize: "14px", color: "rgba(255,255,255,0.2)", marginTop: "8px" }}>Tap the 🔖 icon on any pattern card to save it here.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))", gap: "18px", alignItems: "start" }}>
          {savedCards.map((card, i) => <PatternCard key={`s-${i}`} card={card} index={i} isVisible={true} onGoDeeper={onGoDeeper} onSave={() => {}} isSaved={true} onRemove={onRemove} showRemove={true} blurred={false} onShare={onShare} canGoDeeper={canGoDeeper} onLockedClick={onLockedClick} />)}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────
export default function PatternThief() {
  const [step, setStep] = useState(1);
  const [problem, setProblem] = useState("");
  const [clarifyQ, setClarifyQ] = useState([]);
  const [clarifyA, setClarifyA] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loadingText, setLoadingText] = useState(null);
  const [deeperCard, setDeeperCard] = useState(null);
  const [shareCard, setShareCard] = useState(null);
  const [savedCards, setSavedCards] = useState([]);
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [bonusSearches, setBonusSearches] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  // NEW: auth + status state
  const [authUser, setAuthUser] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authContext, setAuthContext] = useState("default");
  const [showAccount, setShowAccount] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [theftRadius, setTheftRadius] = useState(1); // 0=Near 1=Mid 2=Far 3=Wild, default Mid
  const [recentPrompts, setRecentPrompts] = useState([]); // for ghost chips
  const resultsRef = useRef(null);

  const searchesAllowed = (userStatus?.searches_allowed) ?? (FREE_LIMIT + bonusSearches);
  const effectiveSearchesUsed = userStatus?.searches_used ?? searchesUsed;
  const isAuthenticated = !!authUser;
  const isProEffective = (userStatus?.is_pro === true) || isPro === true;
  // Allow up to 1 preview attempt beyond the free limit
  const canSearch = isProEffective || effectiveSearchesUsed < searchesAllowed + 1;

  // ---- Auth state subscription ----
  useEffect(() => {
    let unsubscribe = () => {};
    (async () => {
      const session = await getCurrentSession();
      if (session?.user) {
        setAuthUser(session.user);
        await migrateAnonymousCardsIfNeeded();
      }
      const status = await fetchUserStatus();
      if (status) setUserStatus(status);
      unsubscribe = onAuthChange(async (user, event) => {
        setAuthUser(user);
        if (user && event === "SIGNED_IN") {
          await migrateAnonymousCardsIfNeeded();
        }
        const s = await fetchUserStatus();
        if (s) setUserStatus(s);
      });
    })();
    // Refresh status when checkout returns success
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setTimeout(async () => {
        const s = await fetchUserStatus();
        if (s) setUserStatus(s);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 1500);
    }
    return () => unsubscribe();
  }, []);

  const refreshUserStatus = async () => {
    const s = await fetchUserStatus();
    if (s) setUserStatus(s);
  };

  const migrateAnonymousCardsIfNeeded = async () => {
    try {
      const anonCards = await loadSavedCards();
      if (anonCards && anonCards.length) {
        const ok = await bulkMigrateCards(anonCards);
        if (ok) {
          await storageSet("saved-cards", []);
        }
      }
      const serverCards = await fetchSavedCards();
      if (serverCards) {
        const normalized = serverCards.map(sc => sc.card_data || sc);
        setSavedCards(normalized);
      }
    } catch (e) {
      console.warn("Card migration failed (non-fatal):", e);
    }
  };

  // ---- Initial state load (legacy localStorage for anonymous users) ----
  useEffect(() => {
    loadSavedCards().then(c => { if (!isAuthenticated) setSavedCards(c); });
    storageGet("searches-used", 0).then(setSearchesUsed);
    storageGet("bonus-searches", 0).then(setBonusSearches);
    storageGet("is-pro", false).then(setIsPro);
    storageGet("user-shown-sources", []).then(h => { userShownSources = h; });
    storageGet("global-shown-sources", [], true).then(h => { globalShownSources = h; });
    storageGet("recent-prompts", []).then(rp => { if (Array.isArray(rp)) setRecentPrompts(rp); });
    // Initialize fingerprint early
    getFingerprint().catch(() => {});
  }, []);

  // Record a prompt into recent history (for ghost chips). Keeps the latest 4, de-duped.
  const recordRecentPrompt = (text) => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    setRecentPrompts(prev => {
      const deduped = [trimmed, ...prev.filter(p => p !== trimmed)].slice(0, 4);
      storageSet("recent-prompts", deduped).catch(() => {});
      return deduped;
    });
  };

  const isCardSaved = (c) => savedCards.some(sc => sc.source_title === c.source_title && sc.domain === c.domain);

  const handleSaveCard = async (card) => {
    if (isCardSaved(card)) return;
    const cardWithMeta = { ...card, saved_at: new Date().toISOString(), original_problem: problem };
    const u = [...savedCards, cardWithMeta];
    setSavedCards(u);
    if (isAuthenticated) {
      await saveCardServer(cardWithMeta);
    } else {
      await saveSavedCards(u);
      // Soft prompt on the FIRST saved card — the moment value is felt
      if (u.length >= 1) setShowSavePrompt(true);
    }
  };

  const handleRemoveCard = async (card) => {
    const u = savedCards.filter(sc => !(sc.source_title === card.source_title && sc.domain === card.domain));
    setSavedCards(u);
    if (isAuthenticated) {
      await deleteCardServer(card.source_title, card.domain);
    } else {
      await saveSavedCards(u);
    }
  };

  const handleRequestAuth = (context) => {
    setAuthContext(context || "default");
    setShowAuth(true);
  };

  const handleSubmit = async () => {
    if (!problem.trim()) return;
    if (!canSearch) { setShowUpgrade(true); return; }
    setError(null); setLoadingText("Reviewing your problem"); setStep(2);
    try {
      const check = await checkIfNeedsClarification(problem);
      if (check && check.needs_clarification && check.questions?.length) {
        setClarifyQ(check.questions);
        setClarifyA(new Array(check.questions.length).fill(""));
        setStep(1.5);
      } else {
        await runAnalysis([]);
      }
    } catch (err) {
      // Free limit reached → open upgrade modal
      if (err?.message?.startsWith("free_limit_reached")) {
        setShowUpgrade(true);
        setStep(1);
        return;
      }
      console.warn("Clarification check failed, proceeding to analysis:", err);
      // If clarification fails for any other reason, just proceed to analysis
      await runAnalysis([]);
    }
  };

  const runAnalysis = async (cl) => {
    if (!canSearch) { setShowUpgrade(true); setStep(1); return; }
    setLoadingText(null); setStep(2); setResults(null); setCardsVisible(false);
    try {
      const radiusKey = THEFT_RADIUS_STOPS[theftRadius]?.key || "mid";
      const data = await analyzeWithAI(problem, cl, radiusKey);
      if (!data || !data.cards || !Array.isArray(data.cards) || data.cards.length === 0) {
        throw new Error("Response missing cards");
      }
      const newCount = searchesUsed + 1;
      setSearchesUsed(newCount);
      storageSet("searches-used", newCount).catch(() => {});
      recordRecentPrompt(problem);
      setResults(data); setStep(3);
      setTimeout(() => setCardsVisible(true), 300);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    } catch (err) {
      console.error("Analysis failed:", err);
      // Free limit reached → open upgrade modal instead of generic error
      if (err?.message?.startsWith("free_limit_reached")) {
        setShowUpgrade(true);
        setStep(1);
        return;
      }
      setError("Something went wrong. Please try again. (" + (err?.message || "Unknown error") + ")");
      setStep(1);
    }
  };

  const handleApplyCoupon = async (code, bonus) => {
    const newBonus = bonusSearches + bonus;
    setBonusSearches(newBonus); await storageSet("bonus-searches", newBonus);
    setTimeout(() => setShowUpgrade(false), 1500);
  };

  const handleReset = () => { setStep(1); setProblem(""); setResults(null); setError(null); setCardsVisible(false); setClarifyQ([]); setClarifyA([]); };
  const handleRefine = () => { setResults(null); setCardsVisible(false); setClarifyQ([]); setClarifyA([]); setStep(1); };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c11", color: "#f1f1f1", fontFamily: "'Lato', sans-serif" }}>
      <style>{globalStyles}</style>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 30% 20%, rgba(232,97,77,0.04), transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(42,157,143,0.04), transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(212,168,67,0.03), transparent 60%)" }} />

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      {deeperCard && <GoDeeperModal card={deeperCard} originalProblem={deeperCard.original_problem || problem} onClose={() => setDeeperCard(null)} />}
      {shareCard && <ShareModal card={shareCard} onClose={() => setShareCard(null)} onImageSaved={() => { if (!isAuthenticated) setShowSavePrompt(true); }} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} userStatus={userStatus} isAuthenticated={isAuthenticated} onRequestAuth={handleRequestAuth} onPurchaseSuccess={refreshUserStatus} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} context={authContext} />}
      {showAccount && <AccountPanel onClose={() => setShowAccount(false)} userStatus={userStatus} onStatusChange={refreshUserStatus} />}
      {showSavePrompt && !isAuthenticated && (
        <div onClick={() => setShowSavePrompt(false)} style={{ position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 900, background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(42,157,143,0.1))", border: "1px solid rgba(212,168,67,0.4)", borderRadius: "14px", padding: "14px 18px", maxWidth: "440px", width: "calc(100% - 40px)", backdropFilter: "blur(10px)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "22px" }}>🔖</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Lato'", fontSize: "13px", fontWeight: 700, color: "#f5f5f5", marginBottom: "2px" }}>Want to keep your saved cards safe?</p>
              <p style={{ fontFamily: "'Lato'", fontSize: "11.5px", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>Sign in (free) so your cards sync across devices.</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setShowSavePrompt(false); handleRequestAuth("save"); }} style={{ background: "rgba(212,168,67,0.2)", border: "1px solid rgba(212,168,67,0.5)", color: "#d4a843", padding: "8px 14px", borderRadius: "8px", fontFamily: "'Lato'", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Sign in</button>
            <button onClick={(e) => { e.stopPropagation(); setShowSavePrompt(false); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "16px", cursor: "pointer", padding: 0 }}>✕</button>
          </div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: "820px", margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* LANDING */}
        {step === 1 && (
          <div style={{ position: "relative", minHeight: "80vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <FloatingIcons />
            {/* TOP BAR: How It Works + Saved + Upgrade + Account/Sign-in */}
            <div style={{ position: "relative", zIndex: 5, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              {/* LEFT: How It Works */}
              <button onClick={() => setShowInfo(true)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "18px", padding: "6px 14px", cursor: "pointer", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s", whiteSpace: "nowrap" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.5)"; e.currentTarget.style.color = "#d4a843"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}>
                How It Works
              </button>

              {/* RIGHT: Saved + Upgrade + Account */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button onClick={() => setStep(4)} title="Saved cards" style={{ background: savedCards.length > 0 ? "rgba(212,168,67,0.08)" : "rgba(255,255,255,0.05)", border: `1px solid ${savedCards.length > 0 ? "rgba(212,168,67,0.3)" : "rgba(255,255,255,0.12)"}`, borderRadius: "18px", padding: "6px 14px", cursor: "pointer", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, color: savedCards.length > 0 ? "#d4a843" : "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s", whiteSpace: "nowrap" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.5)"; e.currentTarget.style.color = "#d4a843"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = savedCards.length > 0 ? "rgba(212,168,67,0.3)" : "rgba(255,255,255,0.12)"; e.currentTarget.style.color = savedCards.length > 0 ? "#d4a843" : "rgba(255,255,255,0.55)"; }}>
                  <span>🔖</span><span style={{ display: "inline" }} className="pt-label-saved">Saved{savedCards.length > 0 && ` (${savedCards.length})`}</span>
                </button>
                {!isProEffective && (
                  <button onClick={() => setShowUpgrade(true)} style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.2), rgba(232,97,77,0.15))", border: "1px solid rgba(212,168,67,0.5)", borderRadius: "18px", padding: "6px 14px", cursor: "pointer", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, color: "#d4a843", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s", whiteSpace: "nowrap" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,168,67,0.3), rgba(232,97,77,0.22))"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,168,67,0.2), rgba(232,97,77,0.15))"; }}>
                    <span>✨</span> Upgrade
                  </button>
                )}
                {isAuthenticated ? (
                  <button onClick={() => setShowAccount(true)} title="Account" style={{ background: isProEffective ? "rgba(212,168,67,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${isProEffective ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.12)"}`, borderRadius: "18px", padding: "6px 14px", cursor: "pointer", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, color: isProEffective ? "#d4a843" : "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = isProEffective ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.12)"; }}>
                    {isProEffective ? "👤 PRO" : "👤 Account"}
                  </button>
                ) : (
                  <button onClick={() => handleRequestAuth("default")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "18px", padding: "6px 14px", cursor: "pointer", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.5)"; e.currentTarget.style.color = "#d4a843"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}>
                    Sign in
                  </button>
                )}
              </div>
            </div>
            {/* Searches counter (only shows when getting low) */}
            <div style={{ textAlign: "center", marginBottom: "8px", zIndex: 4, minHeight: "16px" }}>
              {!isProEffective && !isAuthenticated && searchesUsed > 0 && (searchesAllowed - searchesUsed) >= 3 && (
                <span style={{ fontFamily: "'Lato'", fontSize: "11px", fontWeight: 400, color: "rgba(255,255,255,0.4)", letterSpacing: "0.3px" }}>
                  Welcome back — {searchesAllowed - searchesUsed} searches left
                </span>
              )}
              {!isProEffective && (searchesAllowed - searchesUsed) === 2 && (
                <span style={{ fontFamily: "'Lato'", fontSize: "11px", fontWeight: 400, color: "rgba(255,255,255,0.4)", letterSpacing: "0.3px" }}>
                  2 searches left
                </span>
              )}
              {!isProEffective && (searchesAllowed - searchesUsed) === 1 && (
                <span style={{ fontFamily: "'Lato'", fontSize: "11px", fontWeight: 400, color: "rgba(232,97,77,0.85)", letterSpacing: "0.3px" }}>
                  1 search left — make it count
                </span>
              )}
              {!isProEffective && (searchesAllowed - searchesUsed) <= 0 && (
                <span style={{ fontFamily: "'Lato'", fontSize: "11px", fontWeight: 700, color: "#e8614d" }}>No searches left</span>
              )}
            </div>
            <div style={{ position: "relative", zIndex: 2, animation: "fadeUp 0.8s ease" }}>
              <h1 style={{ fontFamily: "'Lato'", fontSize: "clamp(42px, 8vw, 72px)", fontWeight: 900, lineHeight: 1.05, marginBottom: "20px", textAlign: "center", color: "#f5f5f5" }}>Pattern Thief</h1>
              <p style={{ fontFamily: "'Lato'", fontSize: "18px", fontWeight: 500, color: "rgba(255,255,255,0.92)", textAlign: "center", maxWidth: "560px", margin: "0 auto 10px", lineHeight: 1.5 }}>
                For the curious, the uninspired, and the digitally trapped.
              </p>
              <p style={{ fontFamily: "'Lato'", fontSize: "15px", fontWeight: 400, color: "#d4a843", textAlign: "center", maxWidth: "540px", margin: "0 auto 30px", lineHeight: 1.6 }}>
                Not another chatbot surfacing obvious answers. A thinking machine stealing patterns from fields you'd never think to look.
              </p>
              <div style={{ width: "60px", height: "2px", background: "linear-gradient(90deg, #e8614d, #d4a843, #2a9d8f)", margin: "0 auto 28px" }} />

              {/* PATTERN OF THE DAY — slim daily hook */}
              <div style={{ marginBottom: "20px" }}>
                <PatternOfTheDay onExplore={() => { document.querySelector("#pt-problem-input")?.scrollIntoView({ behavior: "smooth", block: "center" }); document.querySelector("#pt-problem-input")?.focus(); }} />
              </div>

              {/* INPUT BOX — primary action, now directly after Pattern of the Day */}
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "28px", backdropFilter: "blur(12px)" }}>
                <textarea id="pt-problem-input" value={problem} onChange={e => setProblem(e.target.value)} placeholder="e.g. My customers love our product during the trial but 60% don't convert to paid..." rows={5}
                  style={{ width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "18px", color: "#f1f1f1", fontFamily: "'Lato'", fontSize: "15px", fontWeight: 300, lineHeight: 1.65, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(212,168,67,0.4)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px", marginBottom: "20px" }}>
                  <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#d4a843", flexShrink: 0 }} />
                  <p style={{ fontFamily: "'Lato'", fontSize: "13px", fontWeight: 300, color: "rgba(255,255,255,0.3)" }}>The more specific you are — what you've tried, what's failing, who's involved — the sharper the patterns.</p>
                </div>

                {/* THEFT RADIUS — appears once the user has typed something */}
                {problem.trim() && (
                  <div style={{ marginBottom: "20px", animation: "fadeUp 0.3s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "12px" }}>
                      <span style={{ fontSize: "15px" }}>🎯</span>
                      <span style={{ fontFamily: "'Lato'", fontSize: "13px", fontWeight: 700, color: "#f5f5f5" }}>Theft radius</span>
                      <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
                        onMouseEnter={e => { const t = e.currentTarget.querySelector(".radius-tip"); if (t) t.style.display = "block"; }}
                        onMouseLeave={e => { const t = e.currentTarget.querySelector(".radius-tip"); if (t) t.style.display = "none"; }}
                        onClick={e => { const t = e.currentTarget.querySelector(".radius-tip"); if (t) t.style.display = t.style.display === "block" ? "none" : "block"; }}>
                        <span style={{ width: "15px", height: "15px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.35)", color: "rgba(255,255,255,0.55)", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontStyle: "italic" }}>i</span>
                        <span className="radius-tip" style={{ display: "none", position: "absolute", bottom: "130%", left: "50%", transform: "translateX(-50%)", width: "240px", background: "#000", border: "1px solid rgba(212,168,67,0.4)", borderRadius: "8px", padding: "10px 12px", fontFamily: "'Lato'", fontSize: "11px", lineHeight: 1.5, color: "rgba(255,255,255,0.8)", zIndex: 10, fontWeight: 400 }}>
                          How far Pattern Thief reaches for its sources — from adjacent fields (Near) to the genuinely strange (Wild). This is guidance to the AI, not a hard filter: it steers the results but won't be mechanically precise, so nearby stops may overlap.
                        </span>
                      </span>
                    </div>
                    <div style={{ position: "relative", height: "20px" }}>
                      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: "5px", borderRadius: "3px", background: "linear-gradient(90deg,#5DCAA5,#a8c14d,#d4a843,#e8614d)" }} />
                      <div style={{ position: "absolute", top: "50%", left: `${[2, 35, 65, 98][theftRadius]}%`, transform: "translate(-50%,-50%)", width: "18px", height: "18px", borderRadius: "50%", background: "#d4a843", border: "3px solid #1c1c24", boxShadow: "0 2px 8px rgba(0,0,0,0.4)", pointerEvents: "none" }} />
                      <input type="range" min={0} max={3} value={theftRadius} onChange={e => setTheftRadius(parseInt(e.target.value))}
                        style={{ width: "100%", opacity: 0, height: "20px", margin: 0, cursor: "pointer", position: "absolute", top: 0, left: 0, zIndex: 2 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                      {THEFT_RADIUS_STOPS.map((stop, i) => (
                        <span key={stop.key} onClick={() => setTheftRadius(i)}
                          style={{ fontFamily: "'Lato'", fontSize: "12px", color: theftRadius === i ? "#e8924d" : "rgba(255,255,255,0.45)", fontWeight: theftRadius === i ? 700 : 400, cursor: "pointer" }}>
                          {stop.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {error && <p style={{ color: "#e8614d", fontSize: "14px", marginBottom: "12px" }}>{error}</p>}
                <button onClick={handleSubmit} disabled={!problem.trim()}
                  style={{ width: "100%", padding: "16px", background: problem.trim() ? "linear-gradient(135deg, #e8614d, #d4a843)" : "rgba(255,255,255,0.08)", color: problem.trim() ? "#fff" : "rgba(255,255,255,0.5)", border: "none", borderRadius: "12px", fontFamily: "'Lato'", fontSize: "13px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", cursor: problem.trim() ? "pointer" : "default", boxShadow: problem.trim() ? "0 4px 20px rgba(232,97,77,0.25)" : "none" }}>
                  Find Hidden Patterns
                </button>
              </div>

              {/* Ghost chips — now BELOW the input. Returning users see their own recent questions (gold, ↺) mixed with fresh starters (grey) */}
              <div style={{ textAlign: "center", margin: "20px 0 10px" }}>
                <span style={{ fontFamily: "'Lato'", fontSize: "10px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>
                  {recentPrompts.length > 0 ? "Pick up where you left off, or start fresh" : "Need a starting point? Try one of these"}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginBottom: "10px" }}>
                {recentPrompts.map((rp, i) => {
                  const short = rp.length > 34 ? rp.slice(0, 32) + "…" : rp;
                  return (
                    <button key={`recent-${i}`} onClick={() => setProblem(rp)}
                      style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.35)", borderRadius: "16px", padding: "6px 13px", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, color: "#d4a843", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ fontSize: "11px" }}>↺</span> {short}
                    </button>
                  );
                })}
                {STARTER_CHIPS.slice(0, Math.max(2, 4 - recentPrompts.length)).map((chip, i) => (
                  <button key={`starter-${i}`} onClick={() => setProblem(chip.prompt)}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "6px 13px", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.55)", cursor: "pointer", transition: "all 0.2s" }}>
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CLARIFY */}
        {step === 1.5 && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontFamily: "'Lato'", fontSize: "13px", cursor: "pointer", marginBottom: "20px", padding: 0 }}>← Back</button>
            <div style={{ background: "rgba(42,157,143,0.05)", border: "1px solid rgba(42,157,143,0.15)", borderRadius: "18px", padding: "30px" }}>
              <h2 style={{ fontFamily: "'Lato'", fontSize: "26px", fontWeight: 900, color: "#f1f1f1", marginBottom: "8px" }}>A couple of quick questions</h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "24px" }}>This helps us find patterns specific to your situation.</p>
              {clarifyQ.map((q, i) => <div key={i} style={{ marginBottom: "18px" }}>
                <label style={{ fontFamily: "'Lato'", fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.85)", display: "block", marginBottom: "8px" }}>{q}</label>
                <textarea value={clarifyA[i] || ""} onChange={e => { const u = [...clarifyA]; u[i] = e.target.value; setClarifyA(u); }} rows={2} placeholder="Your answer..."
                  style={{ width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px", color: "#f1f1f1", fontFamily: "'Lato'", fontSize: "14px", lineHeight: 1.5, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(42,157,143,0.4)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
              </div>)}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button onClick={async () => { const a = clarifyA.map((ans, i) => ans.trim() ? `${clarifyQ[i]} — ${ans.trim()}` : null).filter(Boolean); await runAnalysis(a); }} style={{ flex: "1 1 200px", padding: "14px", background: "linear-gradient(135deg, #2a9d8f, #1e7870)", color: "#fff", border: "none", borderRadius: "10px", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer" }}>Continue</button>
                <button onClick={() => runAnalysis([])} style={{ flex: "1 1 200px", padding: "14px", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer" }}>Skip & Analyze</button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && <LoadingSequence text={loadingText} />}

        {/* RESULTS */}
        {step === 3 && results && (
          <div ref={resultsRef} style={{ animation: "fadeUp 0.5s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
                <h1 style={{ fontFamily: "'Lato'", fontSize: "clamp(28px, 5vw, 38px)", fontWeight: 900, color: "#f5f5f5" }}>Pattern Thief</h1>
                {!isProEffective && (searchesAllowed - searchesUsed) === 2 && (
                  <span style={{ fontFamily: "'Lato'", fontSize: "11px", fontWeight: 400, color: "rgba(255,255,255,0.3)" }}>
                    2 searches left
                  </span>
                )}
                {!isProEffective && (searchesAllowed - searchesUsed) === 1 && (
                  <span style={{ fontFamily: "'Lato'", fontSize: "11px", fontWeight: 400, color: "rgba(232,97,77,0.7)" }}>
                    1 search left — make it count
                  </span>
                )}
                {!isProEffective && (searchesAllowed - searchesUsed) <= 0 && (
                  <span style={{ fontFamily: "'Lato'", fontSize: "11px", fontWeight: 700, color: "#e8614d" }}>No searches left</span>
                )}
                {isProEffective && <span style={{ fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, color: "#d4a843", background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: "4px", padding: "3px 8px", letterSpacing: "1px", textTransform: "uppercase" }}>Pro</span>}
              </div>
              <button onClick={() => setShowInfo(true)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "18px", padding: "6px 14px", cursor: "pointer", fontFamily: "'Lato'", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.5)"; e.currentTarget.style.color = "#d4a843"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}>How It Works</button>
            </div>
            <FEARBar activeStep={3} />
            <div style={{ background: "rgba(232,97,77,0.06)", border: "1px solid rgba(232,97,77,0.15)", borderRadius: "14px", padding: "22px", marginBottom: "16px", marginTop: "14px" }}>
              <div style={{ fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, color: "#e8614d", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "8px" }}>Your Problem, Fractured</div>
              <p style={{ fontFamily: "'Lato'", fontSize: "18px", fontWeight: 900, color: "rgba(255,255,255,0.88)", lineHeight: 1.5, marginBottom: "14px" }}>{results.fracture_summary}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>{results.sub_problems?.map((sp, i) => <span key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "5px 12px", fontFamily: "'Lato'", fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>{sp}</span>)}</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginBottom: "24px", padding: "10px" }}>
              {DOMAINS.filter(dm => results.cards?.some(c => c.domain === dm.id)).map(dm => <span key={dm.id} style={{ fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "5px", background: `${dm.color}30`, color: dm.color, border: `1px solid ${dm.color}60`, filter: "brightness(1.2)" }}>{dm.icon} {dm.label}</span>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))", gap: "18px", marginBottom: "32px", alignItems: "start" }}>
              {results.cards?.map((card, i) => <PatternCard key={i} card={card} index={i} isVisible={cardsVisible} onGoDeeper={setDeeperCard} onSave={handleSaveCard} isSaved={isCardSaved(card)} onRemove={handleRemoveCard} showRemove={false} blurred={!!results._is_preview} onShare={setShareCard} canGoDeeper={canSearch && !results._is_preview} onLockedClick={() => setShowUpgrade(true)} />)}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={handleRefine} style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.25)", borderRadius: "10px", padding: "13px 24px", color: "#d4a843", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,168,67,0.15)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,168,67,0.08)"; }}>← Refine Prompt</button>
              <button onClick={handleReset} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "13px 28px", color: "rgba(255,255,255,0.45)", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "#f1f1f1"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}>Start Over →</button>
            </div>
            {!isProEffective && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
                <button onClick={() => setShowUpgrade(true)} style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(232,97,77,0.08))", border: "1px solid rgba(212,168,67,0.4)", borderRadius: "10px", padding: "11px 22px", color: "#d4a843", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,168,67,0.22), rgba(232,97,77,0.15))"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(232,97,77,0.08))"; }}>
                  <span>✨</span> Upgrade to Lifetime
                </button>
              </div>
            )}
          </div>
        )}

        {/* SAVED CARDS */}
        {step === 4 && <SavedCardsView savedCards={savedCards} onGoDeeper={setDeeperCard} onRemove={handleRemoveCard} onClose={() => setStep(1)} onShare={setShareCard} canGoDeeper={canSearch} onLockedClick={() => setShowUpgrade(true)} />}

        {/* FOOTER */}
        <footer style={{ marginTop: "80px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ width: "20px", height: "1px", background: "rgba(232,97,77,0.4)" }} />
            <div style={{ width: "20px", height: "1px", background: "rgba(212,168,67,0.4)" }} />
            <div style={{ width: "20px", height: "1px", background: "rgba(42,157,143,0.4)" }} />
          </div>
          <p style={{ fontFamily: "'Lato'", fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", lineHeight: 1.6 }}>
            Pattern Thief · Created by Prashant Anilkumar · © 2026 · All rights reserved
          </p>
          <p style={{ fontFamily: "'Lato'", fontSize: "11.5px", color: "rgba(255,255,255,0.5)", marginBottom: "10px", lineHeight: 1.6 }}>
            Reach out or send feedback to: <a href="mailto:Prashant@BeyondSingular.com" style={{ color: "#d4a843", textDecoration: "none" }}>Prashant@BeyondSingular.com</a>
          </p>
          <p style={{ fontFamily: "'Lato'", fontSize: "11px", color: "rgba(255,255,255,0.28)", fontStyle: "italic", lineHeight: 1.6, maxWidth: "480px", margin: "0 auto" }}>
            Pattern Thief uses AI to generate creative analogies. AI can make mistakes — always verify the patterns and apply your own judgment before acting on them.
          </p>
        </footer>
      </div>
    </div>
  );
}