// src/components/CuriosityConstellation.jsx
// A Pro-only visual map of the user's thinking, generated from their saved cards.
// Each domain they've stolen from becomes a star, sized and brightened by how often
// they've raided it. Unexplored domains show as dim, unlit stars.

import React from "react";

const PALETTE = ["#5DCAA5", "#7F77DD", "#E8A04D", "#4D9DE0", "#e8614d", "#d4a843", "#2a9d8f"];

// Deterministic positions around the centre so the map is stable between visits.
function starPosition(i, total, W, H) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const angle = i * golden;
  const ringStep = total <= 6 ? 0.72 : 0.82;
  const radius = (0.30 + ringStep * 0.42 * ((i % 3) + 1) / 3);
  return {
    x: W / 2 + Math.cos(angle) * radius * (W * 0.40),
    y: H / 2 + Math.sin(angle) * radius * (H * 0.40),
  };
}

export default function CuriosityConstellation({ savedCards = [], allDomains = [], onClose }) {
  // Tally saves per domain
  const counts = {};
  savedCards.forEach(c => {
    const key = c.domain_label || c.domain || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const totalDomains = allDomains.length || 28;
  const raided = entries.length;
  const rarest = entries.length ? entries[entries.length - 1][0] : "—";
  const maxCount = entries.length ? entries[0][1] : 1;

  // Thief profile: breadth vs depth
  const avg = entries.length ? savedCards.length / entries.length : 0;
  const profile = raided >= Math.round(totalDomains * 0.5)
    ? "Wide Ranger"
    : avg >= 3 ? "Deep Miner" : "Explorer";

  const W = 560, H = 320;

  // Unlit stars for domains not yet raided
  const unraided = allDomains
    .filter(d => !counts[d.label])
    .slice(0, 8);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#101018", border: "1px solid rgba(212,168,67,0.3)", borderRadius: "20px", maxWidth: "620px", width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <span style={{ fontSize: "17px" }}>✨</span>
            <span style={{ fontFamily: "'Lato'", fontWeight: 900, fontSize: "16px", color: "#f5f5f5" }}>Your Curiosity Constellation</span>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "30px", height: "30px", color: "#fff", fontSize: "15px", cursor: "pointer" }}>✕</button>
        </div>

        <p style={{ fontFamily: "'Lato'", fontSize: "12px", color: "rgba(255,255,255,0.45)", padding: "12px 22px 0", margin: 0 }}>
          Built from {savedCards.length} saved steal{savedCards.length === 1 ? "" : "s"}. The brighter the star, the more you raid that field.
        </p>

        {/* The map */}
        <div style={{ position: "relative", height: `${H}px`, margin: "8px 0 0", background: "radial-gradient(ellipse at 50% 45%, #15151f 0%, #0c0c11 72%)" }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
            {entries.map(([label], i) => {
              const p = starPosition(i, entries.length, W, H);
              return <line key={`l-${label}`} x1={W / 2} y1={H / 2} x2={p.x} y2={p.y} stroke="rgba(212,168,67,0.22)" strokeWidth="1" />;
            })}
          </svg>

          {/* Centre — you */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "radial-gradient(circle,#d4a843,#8a6a1f)", boxShadow: "0 0 26px rgba(212,168,67,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "21px", margin: "0 auto" }}>🗝️</div>
            <span style={{ fontFamily: "'Lato'", fontSize: "9px", color: "#F2C879", fontWeight: 700, letterSpacing: "1px" }}>YOU</span>
          </div>

          {/* Raided domains */}
          {entries.map(([label, n], i) => {
            const p = starPosition(i, entries.length, W, H);
            const color = PALETTE[i % PALETTE.length];
            const size = 22 + Math.round((n / maxCount) * 22);
            const pctL = (p.x / W) * 100, pctT = (p.y / H) * 100;
            return (
              <div key={label} style={{ position: "absolute", top: `${pctT}%`, left: `${pctL}%`, transform: "translate(-50%,-50%)", textAlign: "center", maxWidth: "110px" }}>
                <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: "50%", background: `${color}33`, border: `2px solid ${color}`, boxShadow: `0 0 ${8 + n * 2}px ${color}66`, margin: "0 auto" }} />
                <span style={{ fontFamily: "'Lato'", fontSize: "8.5px", color, fontWeight: 700, letterSpacing: "0.4px", display: "block", marginTop: "3px", lineHeight: 1.2 }}>
                  {label.length > 16 ? label.slice(0, 15) + "…" : label} ×{n}
                </span>
              </div>
            );
          })}

          {/* Unlit — not yet explored */}
          {unraided.map((d, i) => {
            const angle = (i / Math.max(unraided.length, 1)) * Math.PI * 2 + 0.6;
            const x = 50 + Math.cos(angle) * 44;
            const y = 50 + Math.sin(angle) * 44;
            return <span key={d.id} title={`${d.label} — not yet raided`} style={{ position: "absolute", top: `${y}%`, left: `${x}%`, transform: "translate(-50%,-50%)", fontSize: "13px", opacity: 0.16 }}>{d.icon}</span>;
          })}
        </div>

        {/* Stats */}
        <div style={{ padding: "16px 18px 20px", display: "flex", gap: "10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Lato'", fontSize: "18px", fontWeight: 900, color: "#d4a843", margin: 0 }}>{raided}<span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>/{totalDomains}</span></p>
            <p style={{ fontFamily: "'Lato'", fontSize: "9px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.8px", margin: "3px 0 0" }}>Domains raided</p>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Lato'", fontSize: "12px", fontWeight: 900, color: "#5DCAA5", margin: "3px 0 0", lineHeight: 1.25 }}>{rarest.length > 18 ? rarest.slice(0, 17) + "…" : rarest}</p>
            <p style={{ fontFamily: "'Lato'", fontSize: "9px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.8px", margin: "4px 0 0" }}>Rarest steal</p>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Lato'", fontSize: "12px", fontWeight: 900, color: "#AFA9EC", margin: "3px 0 0" }}>{profile}</p>
            <p style={{ fontFamily: "'Lato'", fontSize: "9px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.8px", margin: "4px 0 0" }}>Thief profile</p>
          </div>
        </div>
      </div>
    </div>
  );
}
