// src/components/UpgradeModal.jsx — Lifetime $37 upgrade flow

import React, { useState } from "react";
import { startCheckout } from "../lib/api";

export default function UpgradeModal({ onClose, userStatus, isAuthenticated, onRequestAuth, onPurchaseSuccess }) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const spotsLeft = userStatus?.early_bird_spots_left ?? 89;

  const handleUpgrade = async () => {
    if (!isAuthenticated) { onRequestAuth("purchase"); return; }
    setCheckoutLoading(true); setCheckoutError(null);
    try { await startCheckout(); }
    catch (e) { setCheckoutError(e.message || "Couldn't start checkout"); setCheckoutLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#18181f", border: "1px solid rgba(212,168,67,0.25)", borderRadius: "20px", padding: "32px 28px", maxWidth: "480px", width: "100%", position: "relative", animation: "fadeUp 0.4s ease", marginTop: "20px", marginBottom: "20px" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "32px", height: "32px", color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>✕</button>

        {/* Tri-color accent */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
          <div style={{ flex: 1, height: "3px", background: "#e8614d", borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "3px", background: "#d4a843", borderRadius: "2px" }} />
          <div style={{ flex: 1, height: "3px", background: "#2a9d8f", borderRadius: "2px" }} />
        </div>

        {/* Early bird badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
          <span style={{ background: "rgba(212,168,67,0.18)", border: "1px solid rgba(212,168,67,0.5)", color: "#d4a843", padding: "4px 10px", borderRadius: "18px", fontSize: "10px", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", fontFamily: "'Lato'" }}>Early Bird</span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontFamily: "'Lato'" }}>First 100 supporters · {spotsLeft} spots left</span>
        </div>

        <h2 style={{ fontFamily: "'Lato'", fontSize: "26px", fontWeight: 900, color: "#f5f5f5", lineHeight: 1.25, marginBottom: "10px" }}>
          Pattern Thief, yours <span style={{ color: "#d4a843", fontWeight: 900 }}>FOR LIFE!</span>
        </h2>
        <p style={{ fontFamily: "'Lato'", fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.55, marginBottom: "22px" }}>
          No subscriptions. No monthly charges. Pay once, own it forever — including everything we build next.
        </p>

        {/* Price */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontFamily: "'Lato'", fontSize: "48px", fontWeight: 900, color: "#d4a843", lineHeight: 1 }}>$37</span>
          <span style={{ fontFamily: "'Lato'", fontSize: "15px", color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>one-time</span>
        </div>

        {/* Lifetime banner */}
        <div style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(42,157,143,0.1))", border: "1px solid rgba(212,168,67,0.3)", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px" }}>
          <p style={{ fontFamily: "'Lato'", fontSize: "13px", fontWeight: 900, color: "#d4a843", marginBottom: "6px" }}>Lifetime Access! Because we know you hate subscriptions.</p>
          <p style={{ fontFamily: "'Lato'", fontSize: "12.5px", color: "rgba(255,255,255,0.75)", lineHeight: 1.55 }}>You're not renting Pattern Thief. You own it. Pay once today and use it for the rest of your life — across any device, any browser, anytime.</p>
        </div>

        {/* Features block 1 */}
        <FeatureBlock title="Here's everything you unlock" features={[
          { emphasis: "Unlimited pattern searches", suffix: " across 28 unexpected domains" },
          { emphasis: "Unlimited Go Deeper", suffix: " explorations on every card" },
          { text: "Save unlimited cards to your personal collection" },
          { text: "Export your saved cards as a downloadable file or shareable images" },
          { text: "Beautiful share-ready PNGs for LinkedIn, X, Slack — perfect for posts and decks" },
          { text: "Access on any device — sign in once, use anywhere" },
          { text: "Your saved cards sync across all your devices automatically" },
        ]} />

        {/* Features block 2 */}
        <FeatureBlock title="Plus everything we build next" features={[
          { emphasis: "Priority access to future domain packs", suffix: " (new fields, themed bundles) as they launch" },
          { text: "New features and experiences as they ship — ", suffixEmphasis: "Free" },
          { text: "Early access to experimental features before public release" },
          { text: "Direct line to the maker — email us anytime, your feedback shapes what comes next" },
        ]} />

        {/* Features block 3 */}
        <FeatureBlock title="The fine print (but the good kind)" features={[
          { emphasis: "14-day no-questions-asked refund.", suffix: " Change your mind? Cancel and get your money back in one click from your account — fully automated, no emails, no forms." },
          { text: "Secure payment processing through Stripe" },
          { text: "No spam, no upsells, no nonsense" },
        ]} />

        <button onClick={handleUpgrade} disabled={checkoutLoading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #d4a843, #e8614d)", color: "#fff", border: "none", borderRadius: "10px", fontFamily: "'Lato'", fontSize: "13px", fontWeight: 900, letterSpacing: "1px", textTransform: "uppercase", cursor: checkoutLoading ? "wait" : "pointer", boxShadow: "0 4px 20px rgba(212,168,67,0.25)" }}>
          {checkoutLoading ? "Loading checkout..." : "Upgrade to Lifetime"}
        </button>
        {checkoutError && <p style={{ fontFamily: "'Lato'", fontSize: "12px", color: "#e8614d", marginTop: "8px", textAlign: "center" }}>{checkoutError}</p>}

        {/* Trust row */}
        <div style={{ display: "flex", justifyContent: "center", gap: "18px", marginTop: "14px", flexWrap: "wrap", fontFamily: "'Lato'" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>🔒 Secure checkout</span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>↻ 14-day refund</span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>∞ Pay once, forever</span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "20px 0 16px" }} />
      </div>
    </div>
  );
}

function FeatureBlock({ title, features }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "10px" }}>{title}</div>
      {features.map((f, i) => (
        <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "7px", alignItems: "flex-start" }}>
          <span style={{ color: "#2a9d8f", fontWeight: 900, fontSize: "13px", flexShrink: 0, lineHeight: 1.5 }}>✓</span>
          <span style={{ fontFamily: "'Lato'", fontSize: "13.5px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
            {f.emphasis && <span style={{ color: "#d4a843", fontWeight: 700 }}>{f.emphasis}</span>}
            {f.suffix || f.text}
            {f.suffixEmphasis && <span style={{ color: "#d4a843", fontWeight: 700 }}>{f.suffixEmphasis}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
