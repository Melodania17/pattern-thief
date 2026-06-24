// src/components/AccountPanel.jsx — Account management for signed-in users

import React, { useState } from "react";
import { signOut } from "../lib/supabase";
import { requestRefund, redeemCoupon } from "../lib/api";

export default function AccountPanel({ onClose, userStatus, onStatusChange }) {
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundResult, setRefundResult] = useState(null);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState(null);

  if (!userStatus?.authenticated) return null;

  const isPro = userStatus.is_pro;
  const refundEligible = userStatus.refund_eligible;
  const refundUntil = userStatus.refund_eligible_until ? new Date(userStatus.refund_eligible_until) : null;
  const purchaseDate = userStatus.purchase_date ? new Date(userStatus.purchase_date) : null;

  const handleCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const result = await redeemCoupon(coupon.trim().toUpperCase());
      setCouponMsg({ ok: true, text: result.message });
      setTimeout(() => { if (onStatusChange) onStatusChange(); }, 1200);
    } catch (e) {
      setCouponMsg({ ok: false, text: e.message || "Couldn't apply code" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    if (onStatusChange) onStatusChange();
    onClose();
  };

  const handleRefund = async () => {
    setRefundLoading(true); setRefundResult(null);
    try {
      const result = await requestRefund();
      setRefundResult({ ok: true, message: result.message });
      setTimeout(() => { if (onStatusChange) onStatusChange(); }, 1500);
    } catch (e) {
      setRefundResult({ ok: false, message: e.message });
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "32px", maxWidth: "460px", width: "100%", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "32px", height: "32px", color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        <h2 style={{ fontFamily: "'Lato'", fontSize: "22px", fontWeight: 900, color: "#f5f5f5", marginBottom: "6px" }}>Your account</h2>
        <p style={{ fontFamily: "'Lato'", fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "22px" }}>{userStatus.email}</p>

        {/* Status block */}
        <div style={{ background: isPro ? "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(42,157,143,0.08))" : "rgba(255,255,255,0.03)", border: `1px solid ${isPro ? "rgba(212,168,67,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "12px", padding: "16px 18px", marginBottom: "18px" }}>
          {isPro ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ background: "rgba(212,168,67,0.2)", color: "#d4a843", padding: "3px 10px", borderRadius: "12px", fontFamily: "'Lato'", fontSize: "10px", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" }}>Pro · Lifetime</span>
                {userStatus.pro_source === "coupon" && <span style={{ fontFamily: "'Lato'", fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>via workshop</span>}
              </div>
              <p style={{ fontFamily: "'Lato'", fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: "6px" }}>Unlimited everything. Forever. Pay nothing else.</p>
              {purchaseDate && <p style={{ fontFamily: "'Lato'", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Activated: {purchaseDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>}
            </>
          ) : (
            <>
              <p style={{ fontFamily: "'Lato'", fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: "14px" }}>You're on the free tier — {userStatus.searches_used} / {userStatus.searches_allowed} searches used.</p>
              <p style={{ fontFamily: "'Lato'", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Have a workshop or promo code?</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Enter code" style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", color: "#f1f1f1", fontFamily: "'Lato'", fontSize: "13px", outline: "none", boxSizing: "border-box" }} onKeyDown={e => e.key === "Enter" && handleCoupon()} />
                <button onClick={handleCoupon} style={{ background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.4)", borderRadius: "8px", padding: "10px 16px", color: "#d4a843", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Apply</button>
              </div>
              {couponMsg && <p style={{ fontFamily: "'Lato'", fontSize: "11px", color: couponMsg.ok ? "#2a9d8f" : "#e8614d", marginTop: "8px" }}>{couponMsg.text}</p>}
            </>
          )}
        </div>

        {/* Refund section */}
        {isPro && refundEligible && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px 18px", marginBottom: "18px" }}>
            <p style={{ fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Refund window</p>
            <p style={{ fontFamily: "'Lato'", fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: "12px" }}>You can cancel and get a full refund until <strong style={{ color: "#f5f5f5" }}>{refundUntil?.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</strong>. No questions, no forms.</p>

            {!confirmRefund ? (
              <button onClick={() => setConfirmRefund(true)} style={{ background: "rgba(232,97,77,0.08)", border: "1px solid rgba(232,97,77,0.3)", color: "#e8614d", padding: "9px 14px", borderRadius: "8px", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Cancel & refund</button>
            ) : refundResult ? (
              <p style={{ fontFamily: "'Lato'", fontSize: "12px", color: refundResult.ok ? "#2a9d8f" : "#e8614d", lineHeight: 1.5 }}>{refundResult.message}</p>
            ) : (
              <>
                <p style={{ fontFamily: "'Lato'", fontSize: "12px", color: "#e8614d", marginBottom: "10px" }}>Are you sure? This will refund your purchase and revoke Pro access.</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleRefund} disabled={refundLoading} style={{ background: "#e8614d", border: "none", color: "#fff", padding: "9px 14px", borderRadius: "8px", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, cursor: refundLoading ? "wait" : "pointer" }}>{refundLoading ? "Processing..." : "Yes, refund my purchase"}</button>
                  <button onClick={() => setConfirmRefund(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", padding: "9px 14px", borderRadius: "8px", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Never mind</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sign out */}
        <button onClick={handleSignOut} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", padding: "11px", borderRadius: "10px", fontFamily: "'Lato'", fontSize: "12px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.5px" }}>Sign out</button>

        <p style={{ fontFamily: "'Lato'", fontSize: "11px", color: "rgba(255,255,255,0.35)", textAlign: "center", marginTop: "16px", lineHeight: 1.6 }}>Questions? Email <a href="mailto:Prashant@BeyondSingular.com" style={{ color: "#d4a843" }}>Prashant@BeyondSingular.com</a></p>
      </div>
    </div>
  );
}
