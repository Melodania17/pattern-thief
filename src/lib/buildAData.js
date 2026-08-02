// src/lib/buildAData.js
// Theft Radius config + domain behavior rules.
// (Pattern of the Day data now lives in patternPool.js)

// Theft Radius stops. The "distance" value is passed to the AI prompt so it knows
// how far from the user's own field to reach for sources.
export const THEFT_RADIUS_STOPS = [
  { key: "near", label: "Near" },
  { key: "mid",  label: "Mid" },
  { key: "far",  label: "Far" },
  { key: "wild", label: "Wild" },
];

// Prompt guidance injected per radius. Near applies to ANY problem type:
// it looks inside the problem's own field first for a non-obvious steal.
export const RADIUS_PROMPT_GUIDANCE = {
  near: "THEFT RADIUS = NEAR. Stay CLOSE to the user's own world. First look INSIDE the user's own field and immediately adjacent fields for a genuinely non-obvious, transferable pattern — e.g. a teaching problem → other education/classroom/learning examples; a fitness problem → other sports/training/body examples; a business problem → other companies, strategy cases, and business stories. Only if nothing sufficiently sharp exists close to home should you step one ring wider. Never give generic, obvious best-practice advice — even close to home it must be a specific, surprising steal, not boilerplate.",
  mid:  "THEFT RADIUS = MID. Reach mostly to DIFFERENT fields and industries from the user's own. A same-field source is allowed ONLY if it is strikingly non-obvious. Aim for a comfortable stretch: surprising but easy to map.",
  far:  "THEFT RADIUS = FAR. Sources must come from fields genuinely far from the user's problem area — nature, history, art, sport, ritual, science. Do NOT use the user's own industry. Surprising but still structurally mappable.",
  wild: "THEFT RADIUS = WILD. Reach for the most distant, most unexpected sources possible — mythology, deep biology, obscure history, the genuinely strange. Maximize surprise while keeping a real structural parallel. Never use the user's own field.",
};

// Extra domain-behavior rules appended to the analysis prompt. Govern two
// domains that should only surface WHEN RELEVANT, never forced.
export const DOMAIN_BEHAVIOR_RULES = `

DOMAIN RELEVANCE RULES:
- BUSINESS & STRATEGY (📊): Held to a STRICTER relevance bar than any other domain. Only draw from it when ALL are true: (a) the user's problem is itself clearly a business/organizational/strategy problem, (b) the theft radius is NEAR, and (c) there is a genuinely non-obvious business case, company story, or strategic pattern that fits. If any is not fully true, do NOT use this domain. Never use Business & Strategy for a non-business problem, and never at Mid/Far/Wild radius.
- LITERATURE & FICTION (Literature & Sci-Fi, and Film/Theater/Storytelling): Actively reach for fictional characters, plots, and works — Shakespeare, novels, sci-fi, plays, films — WHERE GENUINELY RELEVANT. When used, surface concretely, e.g. "In [work], [character] faces [X] and does [Y] — here's how that maps to your situation." Don't force fiction where it doesn't fit, but don't neglect it — a well-chosen fictional parallel is often the most memorable steal.`;
