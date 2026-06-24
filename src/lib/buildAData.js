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
  },
  {
    domainA: "🎻 Music", domainAColor: "#CECBF6", domainABorder: "rgba(127,119,221,0.5)",
    domainB: "💼 Negotiation", domainBColor: "#F2C879", domainBBorder: "rgba(212,168,67,0.5)",
    title: "Jazz musicians 'trade fours' to stay in sync",
    body: "In a solo exchange, players alternate four-bar phrases — listening as much as playing. Skilled negotiators use the same rhythm: make a move, then leave exactly enough space for the other side to respond.",
  },
  {
    domainA: "🐜 Entomology", domainAColor: "#9FE1CB", domainABorder: "rgba(93,202,165,0.5)",
    domainB: "🚚 Logistics", domainBColor: "#F2C879", domainBBorder: "rgba(212,168,67,0.5)",
    title: "Ants find the shortest path without a map",
    body: "Ants leave pheromone trails that evaporate over time — shorter routes stay fresher, so the colony converges on the fastest path. Delivery companies now route fleets with the same evaporating-trail math.",
  },
  {
    domainA: "🌊 Oceanography", domainAColor: "#9FD4F2", domainABorder: "rgba(77,157,224,0.5)",
    domainB: "📈 Marketing", domainBColor: "#F2C879", domainBBorder: "rgba(212,168,67,0.5)",
    title: "The mimic octopus impersonates 15 other species",
    body: "It doesn't have one defense — it has a repertoire, choosing which creature to imitate based on the specific predator. The strongest brands don't have one voice; they shift their signal to match each audience.",
  },
  {
    domainA: "⛰️ Geology", domainAColor: "#E8B98D", domainABorder: "rgba(200,140,80,0.5)",
    domainB: "👥 Team building", domainBColor: "#CECBF6", domainBBorder: "rgba(127,119,221,0.5)",
    title: "Diamonds need both pressure and time",
    body: "Carbon becomes diamond only under sustained pressure deep underground — rush it and you get graphite. High-performing teams form the same way: pressure alone breaks them, pressure plus time forges them.",
  },
  {
    domainA: "🍞 Fermentation", domainAColor: "#F2C879", domainABorder: "rgba(212,168,67,0.5)",
    domainB: "🧠 Learning", domainBColor: "#9FE1CB", domainBBorder: "rgba(93,202,165,0.5)",
    title: "Sourdough gets better by being left alone",
    body: "A starter develops complex flavor during the rest periods, not the mixing. Memory works the same way — the consolidation that makes learning stick happens during rest and sleep, not during cramming.",
  },
  {
    domainA: "🏛️ Ancient Rome", domainAColor: "#E8B98D", domainABorder: "rgba(200,140,80,0.5)",
    domainB: "💻 Software", domainBColor: "#9FD4F2", domainBBorder: "rgba(77,157,224,0.5)",
    title: "Roman roads were built for the return trip",
    body: "Engineers designed roads assuming armies would need to retreat as efficiently as advance. The best systems plan the exit as carefully as the entry — a principle modern software calls 'graceful rollback'.",
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

// Prompt guidance injected per radius. This is the cross-industry fix:
// - Near: same or adjacent industry is acceptable (other industries still welcome).
// - Mid: mostly cross-domain, but a strikingly apt same-field source is allowed.
// - Far: cross-domain only — nature, history, art, sport, ritual.
// - Wild: the strangest, most distant sources — myth, deep biology, the truly unexpected.
export const RADIUS_PROMPT_GUIDANCE = {
  near: "THEFT RADIUS = NEAR. Sources may come from the user's own or adjacent industries, OR from other industries entirely — whatever is most directly transferable. Prioritize practical, recognizable, low-risk analogies the user could apply immediately. Cross-industry theft is encouraged; generic same-field advice is not.",
  mid:  "THEFT RADIUS = MID. Reach mostly to DIFFERENT fields and industries from the user's own. A same-field source is allowed ONLY if it is strikingly non-obvious. Aim for a comfortable stretch: surprising but easy to map.",
  far:  "THEFT RADIUS = FAR. Sources must come from fields genuinely far from the user's problem area — nature, history, art, sport, ritual, science. Do NOT use the user's own industry. Surprising but still structurally mappable.",
  wild: "THEFT RADIUS = WILD. Reach for the most distant, most unexpected sources possible — mythology, deep biology, obscure history, the genuinely strange. Maximize surprise while keeping a real structural parallel. Never use the user's own field.",
};
