// src/components/PatternOfTheDay.jsx
// A button that reveals the day's curated cross-domain pattern. Works logged-out.
// One re-roll allowed, then it locks. "Explore your own problem" hands a starter
// prompt back to the parent so the user can convert the spark into a search.

import React, { useState } from "react";
import { PATTERN_OF_THE_DAY, getTodaysPatternIndex, getRerollIndex, formatTodayLabel } from "../lib/patternPool";

// Session-level dismissal: once closed, stays closed for the whole session
// (survives navigating away from and back to the home page). Resets on full reload.
let sessionDismissed = false;

export default function PatternOfTheDay({ onExplore }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(getTodaysPatternIndex());
  const [rerolled, setRerolled] = useState(false);
  const [dismissed, setDismissed] = useState(sessionDismissed);

  const p = PATTERN_OF_THE_DAY[idx];

  const reroll = () => {
    if (rerolled) return;
    setIdx(getRerollIndex(idx));
    setRerolled(true);
  };

  const dismiss = () => { sessionDismissed = true; setDismissed(true); };

  if (dismissed || sessionDismissed) return null;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
        background: "linear-gradient(135deg, rgba(212,168,67,0.18), rgba(232,97,77,0.12))",
        border: "1px solid rgba(212,168,67,0.45)", borderRadius: "30px", padding: "13px 22px",
        cursor: "pointer", color: "#d4a843", fontFamily: "'Lato'", fontSize: "14px", fontWeight: 700,
      }}>
        <span>✨</span> Today's surprising connection
        <span style={{ fontSize: "11px", opacity: 0.6, fontWeight: 400 }}>tap to reveal</span>
      </button>
    );
  }

  return (
    <div style={{ background: "linear-gradient(145deg,#16161c,#1c1c24)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: "14px", padding: "18px", position: "relative" }}>
      <button onClick={dismiss} aria-label="Dismiss" style={{ position: "absolute", top: "12px", right: "12px", width: "24px", height: "24px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", paddingRight: "30px" }}>
        <span style={{ fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#d4a843" }}>Pattern of the day</span>
        <span style={{ fontFamily: "'Lato'", fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{formatTodayLabel()}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.05)", border: `1px solid ${p.domainABorder}`, borderRadius: "6px", padding: "3px 9px", fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: p.domainAColor }}>{p.domainA}</span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>→</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.05)", border: `1px solid ${p.domainBBorder}`, borderRadius: "6px", padding: "3px 9px", fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: p.domainBColor }}>{p.domainB}</span>
      </div>

      <p style={{ fontFamily: "'Lato'", fontSize: "17px", fontWeight: 900, color: "#f5f5f5", margin: "0 0 8px", lineHeight: 1.35 }}>{p.title}</p>
      <p style={{ fontFamily: "'Lato'", fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.7)", margin: "0 0 12px" }}>{p.body}</p>
      {p.detail && (
        <div style={{ borderLeft: "2px solid rgba(212,168,67,0.4)", paddingLeft: "12px" }}>
          <p style={{ fontFamily: "'Lato'", fontSize: "12.5px", lineHeight: 1.65, color: "rgba(255,255,255,0.6)", margin: 0 }}>{p.detail}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: "9px", marginTop: "16px" }}>
        <button onClick={() => onExplore && onExplore()} style={{ flex: 1, background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.4)", borderRadius: "8px", padding: "10px", color: "#d4a843", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Explore your own problem</button>
        <button onClick={reroll} disabled={rerolled} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "10px 14px", color: rerolled ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)", fontFamily: "'Lato'", fontSize: "12px", cursor: rerolled ? "default" : "pointer" }}>{rerolled ? "That's today's set" : "Show another"}</button>
      </div>
    </div>
  );
}
