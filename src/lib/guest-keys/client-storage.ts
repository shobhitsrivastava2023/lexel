"use client";

import {
  GUEST_COOKIE_NAME,
  GUEST_KEYS_STORAGE_KEY,
  GUEST_MODE_STORAGE_KEY,
  sanitizeGuestKeys,
} from "@/lib/guest-keys/codec";
import type { GuestKeys } from "@/lib/guest-keys/types";

export function loadGuestModeFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(GUEST_MODE_STORAGE_KEY) === "1";
}

export function loadGuestKeysFromStorage(): Partial<GuestKeys> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(GUEST_KEYS_STORAGE_KEY);
    if (!raw) return {};
    return sanitizeGuestKeys(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return {};
  }
}

export function persistGuestMode(enabled: boolean) {
  if (typeof window === "undefined") return;

  if (enabled) {
    window.localStorage.setItem(GUEST_MODE_STORAGE_KEY, "1");
    document.cookie = `${GUEST_COOKIE_NAME}=1; path=/; max-age=31536000; SameSite=Lax`;
  } else {
    window.localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
    document.cookie = `${GUEST_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export function persistGuestKeys(keys: Partial<GuestKeys>) {
  if (typeof window === "undefined") return;
  const sanitized = sanitizeGuestKeys(keys);
  if (Object.keys(sanitized).length === 0) {
    window.localStorage.removeItem(GUEST_KEYS_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(GUEST_KEYS_STORAGE_KEY, JSON.stringify(sanitized));
}

export function clearGuestSession() {
  persistGuestMode(false);
  window.localStorage.removeItem(GUEST_KEYS_STORAGE_KEY);
}
