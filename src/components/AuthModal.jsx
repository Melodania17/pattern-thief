// src/components/AuthModal.jsx — Sign-in dialog with Google + magic link

import React, { useState } from "react";
import { signInWithGoogle, signInWithMagicLink } from "../lib/supabase";

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

  const handleGoogle = async () => {
    setError(null);
    try { await signInWithGoogle(); }
    catch (e) { setError(e.message || "Google sign-in failed"); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "32px", maxWidth: "400px", width: "100%", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "32px", height: "32px", color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        <h2 style={{ fontFamily: "'Lato'", fontSize: "22px", fontWeight: 900, color: "#f5f5f5", marginBottom: "8px" }}>{headlines[context] || headlines.default}</h2>
        <p style={{ fontFamily: "'Lato'", fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: "24px" }}>{subtexts[context] || subtexts.default}</p>

        {!sent ? (
          <>
            <button onClick={handleGoogle} style={{ width: "100%", padding: "12px", background: "#fff", color: "#1a1a1a", border: "none", borderRadius: "10px", fontFamily: "'Lato'", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
              Continue with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0", fontFamily: "'Lato'", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              OR
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            </div>

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
