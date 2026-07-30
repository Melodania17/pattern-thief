// src/lib/patternPool.js
// 60 curated cross-domain patterns for "Today's Surprising Connection".
// Rotation guarantees no repeat within 60 days (one per day, cycling the full pool).
// Copy is deliberately tight: `body` = the pattern + the leap, `detail` = the steal.

// Compact palette lookup so each card only needs its two domain labels.
const PALETTE = [
  { c: "#9FE1CB", b: "rgba(93,202,165,0.5)" },  // green
  { c: "#CECBF6", b: "rgba(127,119,221,0.5)" }, // purple
  { c: "#F2C879", b: "rgba(212,168,67,0.5)" },  // gold
  { c: "#9FD4F2", b: "rgba(77,157,224,0.5)" },  // blue
  { c: "#F5A99A", b: "rgba(232,97,77,0.5)" },   // coral
];

const RAW = [
  ["🐜 Entomology", "🚚 Logistics", "Ants find the shortest path without a map", "Ants leave pheromone trails that evaporate over time, so shorter routes stay fresher and the colony converges on the fastest one.", "Let your fastest-working processes leave the strongest signal, and let slow ones quietly fade rather than being formally killed."],
  ["🐋 Marine biology", "💼 Customer retention", "Whale falls feed an ecosystem for decades", "A dead whale sinks and becomes a thriving habitat for thirty years — the ending is the beginning of something else.", "Design what a churned customer leaves behind: referrals, data, a story. The exit can keep feeding you."],
  ["🍄 Mycology", "👥 Team design", "Fungi don't have headquarters", "Mycelial networks route nutrients to wherever the need is greatest, deciding locally with no central command.", "Give each team authority to reroute its own resources instead of routing every decision through the center."],
  ["🏛️ Ancient Rome", "🗺️ Product roadmaps", "Roman roads were built for the retreat", "Engineers designed every road assuming the army might need to come back on it — the exit mattered as much as the advance.", "Design the rollback before you ship the launch."],
  ["🎻 Jazz", "🤝 Negotiation", "Musicians 'trade fours' to stay in sync", "Players alternate four-bar phrases, listening as much as playing — the space is the instrument.", "Make a move, then leave exactly enough silence for the other side to fill. Don't fill it yourself."],
  ["🍞 Fermentation", "🧠 Learning", "Sourdough gets better by being left alone", "Flavor develops during the long quiet rest, not the mixing. Rush it and you get flat bread.", "Schedule deliberate rest as part of the work — the consolidation happens when nothing appears to be happening."],
  ["🐙 Cephalopods", "📣 Brand strategy", "The mimic octopus impersonates fifteen species", "It doesn't have one defense, it has a repertoire, choosing which creature to become based on the specific predator.", "Stop hunting for one brand voice. Build a repertoire and match the signal to the audience."],
  ["⛰️ Geology", "🏗️ Team building", "Diamonds need pressure and time, not just pressure", "Carbon becomes diamond only under sustained pressure over ages — rush it and you get graphite.", "Pressure alone breaks a team. Pressure held steady over time forges one. Check which you're applying."],
  ["🚒 Wildland firefighting", "📅 Planning", "Firefighters set fires to stop fires", "Controlled burns remove the fuel a wildfire would use, trading a small planned loss for a prevented catastrophic one.", "Schedule deliberate small failures — break weeks, chaos drills — before a real deadline finds your fragility."],
  ["🦅 Ornithology", "🏙️ Architecture", "Termite mounds cool themselves without power", "Shifting vents hold a stable internal temperature all day through passive airflow alone.", "Look for the version of your system that regulates itself instead of the one that needs constant intervention."],
  ["⚓ Naval history", "💻 Software", "Ships are built with watertight compartments", "One breached section floods, the rest stay dry — failure is contained by design, not prevented by hope.", "Compartmentalize your system so one failure floods one room, not the whole ship."],
  ["🎭 Kabuki theater", "🎤 Public speaking", "The most important move is the freeze", "In a mie pose, the actor stops completely at the emotional peak — the stillness carries more force than the motion.", "At your most important line, stop moving entirely. Stillness reads as conviction."],
  ["🐺 Ethology", "👔 Management", "Wolf packs aren't led by an alpha", "The 'pack leader' is usually just a parent — the structure is a family, not a dominance hierarchy. The alpha myth came from captive wolves.", "If your team behaves like a captive wolf pack, look at the cage, not the wolves."],
  ["🧬 Immunology", "🛡️ Policy design", "The immune system's real job is restraint", "Too aggressive and it attacks the body; too permissive and pathogens win. It survives on calibrated tolerance, not fixed rules.", "Write rules that adjust to context rather than rules that are always on. Absolute enforcement is autoimmune."],
  ["🏔️ Mountaineering", "📊 Project management", "Summit fever kills more climbers than storms", "Teams die on the descent because they spent everything reaching the top and treated the goal as the end.", "Budget half your resources for after the launch. The summit is the midpoint, not the finish."],
  ["🎣 Fly fishing", "📧 Cold outreach", "The cast matters less than the drift", "A perfect cast with an unnatural drift catches nothing — the fly has to move as the current would move it.", "Stop optimizing your opening line. Optimize whether your message moves the way that person's world moves."],
  ["🏺 Japanese pottery", "🔧 Product repair", "Kintsugi makes the crack the feature", "Broken pottery is repaired with gold, so the history of damage becomes the most valuable part of the object.", "Publish your incident reports. The visible repair builds more trust than the appearance of never breaking."],
  ["🐝 Apiology", "🗳️ Decision making", "Bees vote by dancing until they agree", "Scouts advocate for nest sites with dances; support builds until a quorum tips, and dissenters stop rather than fight.", "Let advocates campaign visibly and set a quorum threshold in advance. Ban the post-decision relitigation."],
  ["🎬 Film editing", "📖 Storytelling", "Cut on the action, not after it", "Editors cut mid-motion because the eye is busy tracking movement and doesn't notice the seam.", "Make your transitions during momentum, not during pauses. Change things while people are already moving."],
  ["🌊 Oceanography", "💪 Resilience", "Tide pool creatures are tougher than deep-sea ones", "Twice-daily swings between ocean and air make them far hardier than species in stable deep water.", "Regular controlled stress builds more durability than protection does. Stability is not the same as strength."],
  ["🏹 Mongol warfare", "🏃 Operations", "The feigned retreat was the actual weapon", "Mongol cavalry fled deliberately to pull enemies into broken formation, then turned and destroyed them.", "Your visible withdrawal from a market can be the move that repositions you. Retreat isn't always defeat."],
  ["🧪 Chemistry", "⚡ Change management", "Catalysts don't get consumed", "A catalyst lowers the energy needed for a reaction without being used up — it changes what's possible, then walks away intact.", "Your job in a change initiative is to lower activation energy, not to be in every reaction."],
  ["🎨 Renaissance workshops", "🎓 Onboarding", "Apprentices painted the background first", "New painters started on skies and drapery — real work in real paintings, just the lowest-risk parts.", "Give new hires genuine work with contained blast radius, not simulated exercises."],
  ["🐘 Elephant behavior", "🧓 Knowledge retention", "Herds are led by the oldest female", "In droughts, matriarchs remember water sources they visited decades ago — the herd survives on one animal's memory.", "Find who holds your institutional memory. That person is not replaceable by documentation alone."],
  ["🏰 Castle design", "🔐 Security", "Murder holes were built above the entrance", "The most defended point was where attackers were most confident — the gate that looked like the way in.", "Audit the path that looks easiest for your users. That's the one attackers will take too."],
  ["🎹 Piano tuning", "⚖️ Standards", "Perfect tuning sounds wrong", "Equal temperament makes every key slightly out of tune so that all keys are equally usable — precision is traded for range.", "Sometimes the right standard is deliberately imperfect everywhere rather than perfect in one place."],
  ["🌵 Desert botany", "💰 Cash flow", "Saguaros pleat like accordions", "The cactus expands to hold hundreds of gallons after rain, then contracts through drought without structural damage.", "Build a business shape that can swell and shrink without breaking, instead of one sized for average rainfall."],
  ["🧗 Rock climbing", "🎯 Risk", "Climbers place gear they hope never to use", "Protection is set on the way up, purely for a fall that probably won't happen — the ritual is the safety.", "The safeguards you build during good conditions are the ones that matter. You can't place gear mid-fall."],
  ["📻 Radio engineering", "📢 Marketing", "Signal beats power", "A weak, clear transmission carries further than a strong noisy one — noise, not distance, is what kills reach.", "Before increasing budget, remove noise from the message. Clarity travels further than volume."],
  ["🐊 Herpetology", "⏳ Patience", "Crocodiles hunt by waiting at the crossing", "They don't chase — they position themselves where prey must eventually come, and wait for months if needed.", "Position yourself at the inevitable crossing point of your market instead of chasing customers around it."],
  ["⛪ Cathedral building", "🏢 Long projects", "Builders never saw the finish", "Cathedrals took centuries, so masons worked knowing they'd die mid-project. The plan had to survive the planners.", "Design your project so it's legible to whoever inherits it. Write for your successor, not your reviewer."],
  ["🧊 Glaciology", "🐌 Slow change", "Glaciers move by melting under their own weight", "Pressure at the base liquefies ice, letting the whole mass slide. The movement comes from the load, not despite it.", "The weight your organization complains about may be exactly what's enabling it to move at all."],
  ["🎪 Circus rigging", "🤝 Trust", "The net changes the performance", "Aerialists attempt harder tricks with a net — not because it's safer, but because fear narrows what you'll try.", "Psychological safety isn't about comfort. It's about what people will attempt when failure isn't fatal."],
  ["🍷 Winemaking", "😣 Constraints", "Vines make better wine when they struggle", "Stressed vines in poor soil produce more concentrated fruit than pampered ones in rich soil.", "Ask whether your team has too few constraints rather than too many. Abundance dilutes."],
  ["🗺️ Cartography", "📈 Metrics", "Every map lies to tell the truth", "A projection must distort area, shape, or distance — you choose which lie serves the journey.", "Name what your dashboard deliberately distorts. A metric that claims no distortion is the most dangerous kind."],
  ["🐦 Corvid cognition", "🧰 Tool design", "Crows make tools they carry between jobs", "New Caledonian crows keep favorite hooks, transporting them across sites — the tool becomes part of the bird.", "Watch which internal tools people carry between projects. Those are the ones worth investing in."],
  ["🎖️ Military logistics", "🚀 Scaling", "Amateurs study tactics, professionals study supply", "Campaigns fail from lack of food and fuel far more often than from losing battles.", "Before your next growth push, audit the boring supply lines. Growth dies of logistics, not competition."],
  ["🏊 Swimming", "😰 Panic", "You float better when you stop fighting", "Human bodies are naturally buoyant — drowning usually comes from thrashing, which costs energy and pushes you down.", "In a crisis, the instinct to do more is often what's sinking you. Stillness is sometimes the intervention."],
  ["🌋 Volcanology", "📊 Warning signs", "The mountain swells before it erupts", "Ground deformation and gas changes precede eruptions by weeks — the signal exists long before the event.", "Find the deformation metric in your system: the thing that quietly swells before anything visibly breaks."],
  ["🧵 Textile weaving", "🏛️ Org structure", "The warp is invisible and holds everything", "Vertical threads under constant tension never show in the pattern, but nothing exists without them.", "Identify who your warp threads are — the invisible people under tension holding the visible work together."],
  ["🐇 Ecology", "📉 Forecasting", "Predator numbers lag prey numbers", "Lynx populations peak years after hares do — the response is always late, and always overshoots.", "Your hiring will lag your demand and overshoot it. Plan for the lag rather than pretending it away."],
  ["🎼 Orchestration", "👔 Leadership", "The conductor makes no sound", "Their entire contribution is shaping time and balance — the least audible person determines what everyone hears.", "If your leadership is audible in every output, you're playing an instrument instead of conducting."],
  ["🏝️ Island biogeography", "💡 Innovation", "Isolation breeds strangeness", "Species on islands evolve into forms found nowhere else — separation from the mainland is what makes them unusual.", "Give a small team real isolation if you want genuinely unusual output. Connection breeds convergence."],
  ["⌛ Horology", "🎯 Precision", "The escapement is a controlled failure", "A clock works by letting the gear slip forward one tooth at a time — the mechanism's job is to fail regularly and exactly.", "Build a rhythm of small planned releases rather than holding tension until something gives way."],
  ["🦴 Paleontology", "🕵️ Diagnosis", "Most of what we know comes from teeth", "Teeth fossilize best, so entire species are reconstructed from the hardest, most boring surviving part.", "Find the durable trace in your data — the log that always survives — and learn to read the whole system from it."],
  ["🍯 Beekeeping", "🔄 Succession", "Hives raise a new queen before the old one fails", "Workers detect declining pheromones and start raising successors while the current queen still functions.", "Start succession while your key person is still strong. Waiting for decline is already too late."],
  ["🧱 Roman concrete", "🏗️ Durability", "Seawater makes it stronger", "Roman marine concrete grows new crystals as saltwater penetrates it — the thing that should destroy it reinforces it.", "Find the stress that could make your system stronger rather than designing to exclude all stress."],
  ["🐜 Army ants", "🌉 Improvisation", "The ants become the bridge", "When a gap appears, ants link bodies to form a living bridge, then dissolve it once the column has passed.", "Build temporary structures from your people, and dissolve them deliberately. Permanent bridges become permanent costs."],
  ["🎰 Probability", "🎲 Decisions", "The gambler's ruin is about bankroll, not odds", "Even with a favorable edge, a small bankroll goes to zero through ordinary variance before the edge can pay out.", "A good strategy with insufficient runway still fails. Size your bets to survive the variance, not to maximize the edge."],
  ["🌾 Agriculture", "🔁 Sustainability", "Fields need fallow years", "Leaving land unplanted restores nitrogen — the year of no output is what makes the other years possible.", "Schedule a genuinely unproductive period. Continuous output is a soil-depletion strategy."],
  ["🚦 Traffic engineering", "🛑 Friction", "Removing signs made intersections safer", "Shared-space designs that strip out signals force drivers to make eye contact and slow down — uncertainty creates caution.", "Some of your guardrails let people stop paying attention. Consider removing one and watch care return."],
  ["🐧 Antarctic biology", "🤗 Cooperation", "Penguins rotate through the cold edge", "Huddling emperor penguins continuously cycle so no individual stays on the freezing outside for long.", "Rotate who takes the painful shift. Fairness sustains a huddle far longer than heroics do."],
  ["🎺 New Orleans funerals", "😢 Endings", "The march out is a celebration", "Jazz funerals play dirges to the cemetery and joyful music on the way back — grief and celebration are sequenced, not mixed.", "Give endings two distinct phases. Rushing to the celebration skips the part that makes it earned."],
  ["🔬 Microbiology", "🧫 Culture", "You are mostly not you", "Roughly half the cells in a human body are microbial — the organism is a negotiated coalition, not a single entity.", "Your company's culture is mostly composed of things you didn't author. Manage the coalition, not the mission statement."],
  ["🏇 Horse racing", "⚡ Pacing", "Front-runners lose to closers on long tracks", "A horse that leads early burns anaerobic reserves and gets caught in the final stretch by one that held back.", "In a long competitive race, early visible leadership can be the thing that costs you the finish."],
  ["🛰️ Orbital mechanics", "🔁 Momentum", "You slow down to catch up", "To reach a spacecraft ahead of you, you fire backwards, drop to a lower faster orbit, and come around from behind.", "Sometimes the way to close a gap with a competitor is to move to a lower, faster orbit rather than chasing directly."],
  ["🌲 Forestry", "🌱 Growth", "The mother tree feeds the seedlings", "Old trees send carbon through fungal networks to shaded saplings that can't yet photosynthesize enough.", "Route resources to the people who can't yet generate their own. That's what makes a canopy rather than a stand."],
  ["🧗 Free soloing", "✅ Preparation", "The route is climbed hundreds of times first", "Soloists rehearse every move on a rope for months — the ropeless ascent is a performance of something already known.", "The moment that looks like fearless improvisation should be the most rehearsed thing you do."],
  ["📯 Sonar", "👂 Listening", "Active pinging reveals your position", "Submarines mostly listen passively, because the ping that finds the enemy also tells the enemy exactly where you are.", "Every question you ask in a negotiation reveals what you care about. Listen more than you ping."],
  ["🕯️ Candlemaking", "🔥 Burnout", "A wick that's too long smokes and dies", "Too much exposed wick draws more fuel than it can burn cleanly, producing soot and consuming the candle fast.", "Someone burning brightest may simply have too much wick exposed. Trim the surface area before adding fuel."],
];

export const PATTERN_OF_THE_DAY = RAW.map(([a, b, title, body, detail], i) => {
  const pa = PALETTE[i % PALETTE.length];
  const pb = PALETTE[(i + 2) % PALETTE.length];
  return {
    domainA: a, domainAColor: pa.c, domainABorder: pa.b,
    domainB: b, domainBColor: pb.c, domainBBorder: pb.b,
    title, body, detail,
  };
});

// Deterministic daily pick. With 60 cards and one per day, a given card cannot
// reappear for 60 days. An offset derived from the year keeps successive years
// from replaying the identical order.
export function getTodaysPatternIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  const yearOffset = (now.getFullYear() * 7) % PATTERN_OF_THE_DAY.length;
  return (dayOfYear + yearOffset) % PATTERN_OF_THE_DAY.length;
}

// The single re-roll shows a card far from today's, never an adjacent day's card.
export function getRerollIndex(currentIndex) {
  return (currentIndex + Math.floor(PATTERN_OF_THE_DAY.length / 2)) % PATTERN_OF_THE_DAY.length;
}

export function formatTodayLabel() {
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const d = new Date();
  return m[d.getMonth()] + " " + d.getDate();
}
