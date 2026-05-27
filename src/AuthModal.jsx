// src/components/AuthModal.jsx — Sign-in dialog with Google + magic link

import React, { useState } from "react";
import { signInWithMagicLink } from "../lib/supabase";

export default function AuthModal({ onClose, context = "default" }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const headlines = {
    default: "Sign in to Pattern Thief",
    purchase: "Sign in to complete your purchase",
    coupon: "Sign in to redeem your code",
    save: "Sign in to save your cards forever",
    refund: "Sign in to your account",
  };
  const subtexts = {
    default: "We use magic links — no passwords to remember.",
    purchase: "Your account is how your lifetime access stays with you across any device.",
    coupon: "Workshop codes are tied to your account so your benefits never get lost.",
    save: "Your saved cards will sync across all your devices. No spam, ever.",
    refund: "Sign in to manage your account and process refunds.",
  };

  const handleEmail = async () => {
    if (!email.includes("@")) { setError("Enter a valid email"); return; }
    setLoading(true); setError(null);
    try {
      await signInWithMagicLink(email);
      setSent(true);
    } catch (e) {
      setError(e.message || "Couldn't send the link. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "32px", maxWidth: "400px", width: "100%", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "32px", height: "32px", color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        <h2 style={{ fontFamily: "'Lato'", fontSize: "22px", fontWeight: 900, color: "#f5f5f5", marginBottom: "8px" }}>{headlines[context] || headlines.default}</h2>
        <p style={{ fontFamily: "'Lato'", fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: "24px" }}>{subtexts[context] || subtexts.default}</p>

        {!sent ? (
          <>
            {/* Google sign-in disabled until OAuth is configured */}

            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px 14px", color: "#f1f1f1", fontFamily: "'Lato'", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "10px" }} onKeyDown={e => e.key === "Enter" && handleEmail()} onFocus={e => e.target.style.borderColor = "rgba(212,168,67,0.4)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />

            <button onClick={handleEmail} disabled={loading} style={{ width: "100%", padding: "12px", background: "rgba(212,168,67,0.15)", color: "#d4a843", border: "1px solid rgba(212,168,67,0.4)", borderRadius: "10px", fontFamily: "'Lato'", fontSize: "13px", fontWeight: 700, cursor: loading ? "wait" : "pointer", letterSpacing: "0.5px" }}>
              {loading ? "Sending..." : "Email me a magic link"}
            </button>

            {error && <p style={{ fontFamily: "'Lato'", fontSize: "12px", color: "#e8614d", marginTop: "10px" }}>{error}</p>}
          </>
        ) : (
          <div style={{ background: "rgba(45,157,143,0.1)", border: "1px solid rgba(45,157,143,0.3)", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>✉️</div>
            <p style={{ fontFamily: "'Lato'", fontSize: "14px", fontWeight: 700, color: "#f5f5f5", marginBottom: "6px" }}>Check your email</p>
            <p style={{ fontFamily: "'Lato'", fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>We sent a one-click sign-in link to <strong style={{ color: "#d4a843" }}>{email}</strong>. Click it to sign in.</p>
          </div>
        )}

        <p style={{ fontFamily: "'Lato'", fontSize: "10px", color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "20px", lineHeight: 1.6 }}>
          By signing in, you agree to our <a href="/terms" style={{ color: "rgba(255,255,255,0.5)" }}>Terms</a> and <a href="/privacy" style={{ color: "rgba(255,255,255,0.5)" }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
