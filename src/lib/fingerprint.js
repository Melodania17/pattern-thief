// src/lib/fingerprint.js — Browser fingerprint for free-tier anti-abuse

import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedFingerprint = null;

export async function getFingerprint() {
  if (cachedFingerprint) return cachedFingerprint;
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    return cachedFingerprint;
  } catch (err) {
    console.warn("Fingerprint generation failed:", err);
    // Fallback: a stable random ID stored in localStorage
    let fallback = localStorage.getItem("pt_fp_fallback");
    if (!fallback) {
      fallback = "fb_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("pt_fp_fallback", fallback);
    }
    cachedFingerprint = fallback;
    return cachedFingerprint;
  }
}
