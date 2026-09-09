// src/components/HomepageSections.jsx
// Below-the-fold explainer content for first-time visitors.
// Copy is final/approved — edit here if wording changes.

import React from "react";

const Eyebrow = ({ color, children }) => (
  <p style={{ fontFamily: "'Lato'", fontSize: "10px", fontWeight: 900, color, letterSpacing: "2.5px", margin: "0 0 10px", textTransform: "uppercase" }}>{children}</p>
);
const H2 = ({ children, style }) => (
  <h2 style={{ fontFamily: "'Lato'", fontSize: "clamp(21px, 4.2vw, 27px)", fontWeight: 900, color: "#f5f5f5", margin: 0, lineHeight: 1.22, letterSpacing: "-0.3px", ...style }}>{children}</h2>
);
const Section = ({ children, style }) => (
  <section style={{ padding: "44px 4px", borderTop: "1px solid rgba(255,255,255,0.06)", ...style }}>{children}</section>
);

const WHEN_CARDS = [
  { c: "#AFA9EC", label: "When the brainstorm is a dead end", body: "You've filled the whiteboard and it all reads like last year's plan. You need an angle from outside the room." },
  { c: "#9FE1CB", label: "When the pitch isn't landing", body: "The strategy is right, but the corporate jargon is putting them to sleep. Find a high-leverage metaphor from an unexpected field that finally makes it click." },
  { c: "#F2C879", label: "When every competitor looks the same", body: "You're stuck in an industry echo chamber. You need a structural advantage borrowed from a completely unrelated field." },
  { c: "#F5A99A", label: "When you're prepping a session or a talk", body: "You need material that makes a room sit up — something nobody in it has heard before." },
  { c: "#9FD4F2", label: "When you're pressure-testing a decision", body: "Before you commit, see the problem the way a completely different discipline would frame it." },
  { c: "#CECBF6", label: "When you're just exploring", body: "Wander across unrelated fields and see what you discover. The best ideas and insights come from non-linear curiosity." },
];

const STEPS = [
  { n: "01 / DECOUPLE", c: "#e8614d", title: "Describe your problem in plain words", body: "Pattern Thief strips away industry jargon to find the actual structural tension underneath." },
  { n: "02 / CROSS-POLLINATE", c: "#d4a843", title: "It raids 28 unrelated fields", body: "From biology to disaster response—hunting for unexpected domains that have already solved your structural problem. A slider lets you control how far it reaches." },
  { n: "03 / SYNTHESIZE", c: "#5DCAA5", title: "You get something you can actually use", body: "Each card names the pattern and how to apply it. Save it for a presentation, jump down a rabbit hole, or share it with a client or colleague." },
];

export const EXAMPLE_PROMPTS = [
  "How do we keep our best teachers from leaving?",
  "I need a metaphor that explains compound interest to skeptics.",
  "Our cross-functional teams keep hoarding data instead of sharing it.",
  "How do we get members to actually show up to events?",
];

export default function HomepageSections({ onPickExample, onScrollToTop }) {
  return (
    <div style={{ marginTop: "10px" }}>

      {/* ── SECTION 1: THE TRAP ── */}
      <Section style={{ textAlign: "center" }}>
        <Eyebrow color="#e8614d">The Trap</Eyebrow>
        <H2>AI made average thinking free.</H2>
        <p style={{ fontFamily: "'Lato'", fontSize: "15px", color: "rgba(255,255,255,0.62)", lineHeight: 1.65, margin: "16px auto 0", maxWidth: "480px" }}>
          Ask any chatbot a strategic question, and it hands you the industry median—the exact same playbook your competitors are using. Standard efficiency engines are built for consensus. You need an engine built for cognitive friction.
        </p>
      </Section>

      {/* ── SECTION 2: THE DIFFERENCE ── */}
      <Section>
        <div style={{ textAlign: "center" }}>
          <Eyebrow color="#5DCAA5">The Difference</Eyebrow>
          <H2>Same question. Two very different answers.</H2>
          <p style={{ fontFamily: "'Lato'", fontSize: "13px", color: "rgba(255,255,255,0.42)", fontStyle: "italic", margin: "16px 0 20px" }}>
            “How do we reduce customer churn?”
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "12px" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "13px", padding: "18px" }}>
            <p style={{ fontFamily: "'Lato'", fontSize: "9.5px", fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: "1.5px", margin: "0 0 11px" }}>EVERY OTHER AI</p>
            <p style={{ fontFamily: "'Lato'", fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>“Improve onboarding. Gather feedback. Offer loyalty incentives. Segment at-risk users.”</p>
            <p style={{ fontFamily: "'Lato'", fontSize: "10.5px", color: "rgba(255,255,255,0.28)", fontStyle: "italic", margin: "13px 0 0" }}>The answer everyone else also has.</p>
          </div>
          <div style={{ background: "rgba(93,202,165,0.07)", border: "1px solid rgba(93,202,165,0.3)", borderRadius: "13px", padding: "18px" }}>
            <p style={{ fontFamily: "'Lato'", fontSize: "9.5px", fontWeight: 900, color: "#5DCAA5", letterSpacing: "1.5px", margin: "0 0 11px" }}>🗝️ PATTERN THIEF</p>
            <p style={{ fontFamily: "'Lato'", fontSize: "10.5px", fontWeight: 700, color: "#9FE1CB", letterSpacing: "0.8px", margin: "0 0 7px" }}>🐋 MARINE BIOLOGY</p>
            <p style={{ fontFamily: "'Lato'", fontSize: "13px", color: "rgba(255,255,255,0.78)", lineHeight: 1.55, margin: 0 }}>
              A dead whale sinks and feeds an ecosystem for 30 years. <strong style={{ color: "#fff" }}>Design what a churned customer leaves behind.</strong>
            </p>
            <p style={{ fontFamily: "'Lato'", fontSize: "10.5px", color: "rgba(93,202,165,0.7)", fontStyle: "italic", margin: "13px 0 0" }}>The answer nobody else has.</p>
          </div>
        </div>
      </Section>

      {/* ── SECTION 3: HOW IT WORKS ── */}
      <Section>
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <Eyebrow color="#d4a843">How It Works</Eyebrow>
          <H2>Three steps, and no prompt engineering.</H2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "600px", margin: "0 auto" }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              {i > 0 && <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />}
              <div>
                <p style={{ fontFamily: "'Lato'", fontSize: "11px", fontWeight: 900, color: s.c, letterSpacing: "1.5px", margin: "0 0 6px" }}>{s.n}</p>
                <p style={{ fontFamily: "'Lato'", fontSize: "15px", fontWeight: 900, color: "#f1f1f1", margin: "0 0 5px" }}>{s.title}</p>
                <p style={{ fontFamily: "'Lato'", fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0 }}>{s.body}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </Section>

      {/* ── SECTION 4: WHEN TO USE IT ── */}
      <Section>
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <Eyebrow color="#7F77DD">When To Use It</Eyebrow>
          <H2>Reach for it when the obvious isn't enough.</H2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "11px" }}>
          {WHEN_CARDS.map(c => (
            <div key={c.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ fontFamily: "'Lato'", fontSize: "9.5px", fontWeight: 900, color: c.c, letterSpacing: "1.2px", margin: "0 0 8px", lineHeight: 1.35, textTransform: "uppercase" }}>{c.label}</p>
              <p style={{ fontFamily: "'Lato'", fontSize: "12.5px", color: "rgba(255,255,255,0.62)", lineHeight: 1.55, margin: 0 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── SECTION 5: WHAT TO ASK IT ── */}
      <Section>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <Eyebrow color="#4D9DE0">What To Ask It</Eyebrow>
          <H2>Works best on stuck problems.</H2>
          <p style={{ fontFamily: "'Lato'", fontSize: "12.5px", color: "rgba(255,255,255,0.45)", margin: "10px 0 0" }}>Tap one to try it →</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "9px", maxWidth: "600px", margin: "0 auto" }}>
          {EXAMPLE_PROMPTS.map(p => (
            <button key={p} onClick={() => { onPickExample && onPickExample(p); onScrollToTop && onScrollToTop(); }}
              style={{ textAlign: "left", background: "rgba(77,157,224,0.08)", border: "1px solid rgba(77,157,224,0.28)", borderRadius: "10px", padding: "14px 16px", fontFamily: "'Lato'", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", cursor: "pointer", transition: "all 0.15s", lineHeight: 1.45 }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(77,157,224,0.16)"; e.currentTarget.style.borderColor = "rgba(77,157,224,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(77,157,224,0.08)"; e.currentTarget.style.borderColor = "rgba(77,157,224,0.28)"; }}>
              “{p}”
            </button>
          ))}
        </div>
        <p style={{ fontFamily: "'Lato'", fontSize: "12px", color: "rgba(255,255,255,0.35)", textAlign: "center", margin: "18px auto 0", lineHeight: 1.6, maxWidth: "440px" }}>
          Not built for: quick facts, writing your emails, or anything with an obvious answer.
        </p>
      </Section>

      {/* ── SECTION 6: CLOSING CTA ── */}
      <Section style={{ textAlign: "center", paddingBottom: "20px" }}>
        <H2 style={{ marginBottom: "12px" }}>Everyone else is searching.<br />You're stealing.</H2>
        <p style={{ fontFamily: "'Lato'", fontSize: "13.5px", color: "rgba(255,255,255,0.55)", margin: "0 0 22px" }}>Three free searches.</p>
        <button onClick={() => onScrollToTop && onScrollToTop()}
          style={{ background: "linear-gradient(135deg,#e8614d,#d4a843)", border: "none", borderRadius: "10px", padding: "14px 32px", fontFamily: "'Lato'", fontSize: "12.5px", fontWeight: 900, color: "#fff", letterSpacing: "1.5px", cursor: "pointer", boxShadow: "0 4px 18px rgba(232,97,77,0.25)" }}>
          STEAL YOUR FIRST PATTERN ↑
        </button>
      </Section>
    </div>
  );
}
