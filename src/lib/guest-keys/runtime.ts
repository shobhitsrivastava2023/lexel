import "server-only";

import { AsyncLocalStorage } from "async_hooks";

import type { GuestKeys } from "@/lib/guest-keys/types";

const guestKeysStorage = new AsyncLocalStorage<Partial<GuestKeys>>();

export function runWithGuestKeys<T>(
  keys: Partial<GuestKeys> | null | undefined,
  fn: () => T,
): T {
  if (!keys || Object.keys(keys).length === 0) {
    return fn();
  }
  return guestKeysStorage.run(keys, fn);
}

export function getActiveGuestKeys(): Partial<GuestKeys> | undefined {
  return guestKeysStorage.getStore();
}

export function effectiveGuestValue<K extends keyof GuestKeys>(
  key: K,
  serverValue: string | undefined,
  explicitKeys?: Partial<GuestKeys> | null,
): string | undefined {
  const source = explicitKeys ?? getActiveGuestKeys();
  const guestVal = source?.[key];
  if (typeof guestVal === "string" && guestVal.trim()) {
    return guestVal.trim();
  }
  return serverValue;
}
