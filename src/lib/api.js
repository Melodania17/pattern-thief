// src/lib/api.js — Thin wrapper around fetch that adds auth + fingerprint headers

import { getAccessToken } from "./supabase";
import { getFingerprint } from "./fingerprint";

async function buildHeaders(extra = {}) {
  const headers = { "Content-Type": "application/json", ...extra };
  const token = await getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const fp = await getFingerprint();
  if (fp) headers["X-Fingerprint"] = fp;
  return headers;
}

export async function apiPost(path, body) {
  const headers = await buildHeaders();
  const r = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    credentials: "include",
  });
  return r;
}

export async function apiGet(path) {
  const headers = await buildHeaders();
  const r = await fetch(path, {
    method: "GET",
    headers,
    credentials: "include",
  });
  return r;
}

export async function apiDelete(path, body) {
  const headers = await buildHeaders();
  const r = await fetch(path, {
    method: "DELETE",
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  return r;
}

export async function fetchUserStatus() {
  try {
    const r = await apiGet("/api/user-status");
    if (!r.ok) return null;
    return await r.json();
  } catch (err) {
    console.warn("user-status fetch failed:", err);
    return null;
  }
}

export async function startCheckout() {
  const r = await apiPost("/api/stripe-checkout", {});
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Checkout failed");
  if (data.url) window.location.href = data.url;
  return data;
}

export async function requestRefund() {
  const r = await apiPost("/api/stripe-refund", {});
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || data.message || "Refund failed");
  return data;
}

export async function redeemCoupon(code) {
  const r = await apiPost("/api/redeem-coupon", { code });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Coupon failed");
  return data;
}

export async function fetchSavedCards() {
  const r = await apiGet("/api/saved-cards");
  if (!r.ok) return [];
  const data = await r.json();
  return data.cards || [];
}

export async function saveCardServer(card) {
  const r = await apiPost("/api/saved-cards", { card });
  return r.ok;
}

export async function deleteCardServer(source_title, domain) {
  const r = await apiDelete("/api/saved-cards", { source_title, domain });
  return r.ok;
}

export async function bulkMigrateCards(cards) {
  const r = await apiPost("/api/saved-cards", { action: "bulk_migrate", cards });
  return r.ok;
}
