// src/lib/buildAData.js
// Curated data for Build A features: Pattern of the Day + Theft Radius.
// Pattern of the Day is a hand-curated rotating list. The same pattern shows to
// everyone on a given calendar day (picked by day-of-year), so it needs no API call
// and works for logged-out visitors. One re-roll is allowed in the UI.

export const PATTERN_OF_THE_DAY = [
  {
    domainA: "🐦 Ornithology", domainAColor: "#9FE1CB", domainABorder: "rgba(93,202,165,0.5)",
    domainB: "🏙️ Urban design", domainBColor: "#CECBF6", domainBBorder: "rgba(127,119,221,0.5)",
    title: "Termite mounds cool themselves without electricity",
    body: "African termites build mounds with shifting vents that hold a stable temperature all day. An architect in Zimbabwe copied the structure for a building that uses 90% less cooling energy.",
    detail: "The termites don't fight the heat — they let the structure do the work. As outside temperatures swing, the mound's network of tunnels opens and closes, driving convection currents that vent hot air and pull cool air up from below. No moving parts, no power. The Eastgate Centre in Harare applied this exact principle: it stays comfortable in a hot climate using a fraction of the energy of a conventional building. The steal: stop solving with force (bigger AC, more power) and ask what the structure itself could do passively.",
  },
  {
    domainA: "🎻 Music", domainAColor: "#CECBF6", domainABorder: "rgba(127,119,221,0.5)",
    domainB: "💼 Negotiation", domainBColor: "#F2C879", domainBBorder: "rgba(212,168,67,0.5)",
    title: "Jazz musicians 'trade fours' to stay in sync",
    body: "In a solo exchange, players alternate four-bar phrases — listening as much as playing. Skilled negotiators use the same rhythm: make a move, then leave exactly enough space for the other side to respond.",
    detail: "Trading fours works because the constraint (four bars, then you stop) forces genuine listening — you can't just wait for your turn, you have to respond to what was just played. The magic is in the handoff, not the solo. Great negotiators do the same: they make a defined offer, then deliberately go quiet, leaving a clean space the other side has to fill. The silence isn't passive — it's structured, like the four-bar limit. The steal: build a rhythm of move-and-space into your next hard conversation instead of talking to fill the gaps.",
  },
  {
    domainA: "🐜 Entomology", domainAColor: "#9FE1CB", domainABorder: "rgba(93,202,165,0.5)",
    domainB: "🚚 Logistics", domainBColor: "#F2C879", domainBBorder: "rgba(212,168,67,0.5)",
    title: "Ants find the shortest path without a map",
    body: "Ants leave pheromone trails that evaporate over time — shorter routes stay fresher, so the colony converges on the fastest path. Delivery companies now route fleets with the same evaporating-trail math.",
    detail: "No ant knows the whole route. Each just follows and reinforces the strongest scent, and because shorter paths get traveled more often in the same time, their trails stay stronger while longer ones fade. The system finds the optimum with no central planner. 'Ant colony optimization' is now a real algorithm used to route delivery trucks, telecom traffic, and supply chains. The steal: when a problem is too complex to plan top-down, design simple local rules and a feedback signal that naturally strengthens good paths and lets bad ones decay.",
  },
  {
    domainA: "🌊 Oceanography", domainAColor: "#9FD4F2", domainABorder: "rgba(77,157,224,0.5)",
    domainB: "📈 Marketing", domainBColor: "#F2C879", domainBBorder: "rgba(212,168,67,0.5)",
    title: "The mimic octopus impersonates 15 other species",
    body: "It doesn't have one defense — it has a repertoire, choosing which creature to imitate based on the specific predator. The strongest brands don't have one voice; they shift their signal to match each audience.",
    detail: "Most animals have a single survival trick. The mimic octopus reads the threat and picks the right disguise — flattening into a venomous flatfish for one predator, mimicking a sea snake for another. Its edge is contextual range, not a fixed defense. The parallel for brands and communicators: a rigid one-size message is fragile, but a clear identity expressed differently per audience is resilient. The steal: keep your core unchanged, but build a deliberate repertoire of how you present it depending on who's in front of you.",
  },
  {
    domainA: "⛰️ Geology", domainAColor: "#E8B98D", domainABorder: "rgba(200,140,80,0.5)",
    domainB: "👥 Team building", domainBColor: "#CECBF6", domainBBorder: "rgba(127,119,221,0.5)",
    title: "Diamonds need both pressure and time",
    body: "Carbon becomes diamond only under sustained pressure deep underground — rush it and you get graphite. High-performing teams form the same way: pressure alone breaks them, pressure plus time forges them.",
    detail: "Diamond and graphite are the same element — pure carbon. The only difference is the conditions: diamonds require intense pressure sustained over a very long period at depth. Apply pressure too fast or too shallow and you get something brittle. Teams under stress follow the same rule: a crucible moment alone doesn't build cohesion, and can shatter a group. It's pressure held steadily over time, with the team kept intact, that forges trust and capability. The steal: if you want a resilient team, don't just add pressure — protect continuity so the pressure has time to do its work.",
  },
  {
    domainA: "🍞 Fermentation", domainAColor: "#F2C879", domainABorder: "rgba(212,168,67,0.5)",
    domainB: "🧠 Learning", domainBColor: "#9FE1CB", domainBBorder: "rgba(93,202,165,0.5)",
    title: "Sourdough gets better by being left alone",
    body: "A starter develops complex flavor during the rest periods, not the mixing. Memory works the same way — the consolidation that makes learning stick happens during rest and sleep, not during cramming.",
    detail: "The visible work of baking is mixing and shaping, but the flavor and structure develop during the long, quiet fermentation when nothing seems to be happening. Rush it and you get flat, lifeless bread. Learning has the identical hidden phase: the brain consolidates memories during rest and sleep, not during the frantic study session. Cramming feels productive but skips the fermentation. The steal: schedule deliberate rest as part of the work, not as its absence — the 'doing nothing' is where the result actually forms.",
  },
  {
    domainA: "🏛️ Ancient Rome", domainAColor: "#E8B98D", domainABorder: "rgba(200,140,80,0.5)",
    domainB: "💻 Software", domainBColor: "#9FD4F2", domainBBorder: "rgba(77,157,224,0.5)",
    title: "Roman roads were built for the return trip",
    body: "Engineers designed roads assuming armies would need to retreat as efficiently as advance. The best systems plan the exit as carefully as the entry — a principle modern software calls 'graceful rollback'.",
    detail: "Roman military roads weren't just built to project power outward — they were engineered so a legion could withdraw in good order if a campaign failed, with consistent widths, waystations, and gradients that worked in both directions. Planning the retreat wasn't defeatism; it was what made bold advances survivable. Modern software borrows the same wisdom: good deployment systems build in 'graceful rollback' so a failed release can be undone cleanly. The steal: whenever you commit to something risky, design the exit with as much care as the entrance — it's what lets you move boldly.",
  },
];

// Pick today's pattern deterministically from the day of the year.
export function getTodaysPatternIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % PATTERN_OF_THE_DAY.length;
}

export function formatTodayLabel() {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const d = new Date();
  return months[d.getMonth()] + " " + d.getDate();
}

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
