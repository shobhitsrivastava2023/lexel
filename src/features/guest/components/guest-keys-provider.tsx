"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearGuestSession,
  loadGuestKeysFromStorage,
  loadGuestModeFromStorage,
  persistGuestKeys,
  persistGuestMode,
} from "@/lib/guest-keys/client-storage";
import type { GuestKeys } from "@/lib/guest-keys/types";

type GuestKeysContextValue = {
  isGuestMode: boolean;
  guestKeys: Partial<GuestKeys>;
  setGuestKeys: (keys: Partial<GuestKeys>) => void;
  enableGuestMode: (keys?: Partial<GuestKeys>) => void;
  exitGuestMode: () => void;
  isReady: boolean;
};

const GuestKeysContext = createContext<GuestKeysContextValue | null>(null);

export function GuestKeysProvider({ children }: { children: ReactNode }) {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestKeys, setGuestKeysState] = useState<Partial<GuestKeys>>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsGuestMode(loadGuestModeFromStorage());
    setGuestKeysState(loadGuestKeysFromStorage());
    setIsReady(true);
  }, []);

  const setGuestKeys = useCallback((keys: Partial<GuestKeys>) => {
    persistGuestKeys(keys);
    setGuestKeysState(keys);
  }, []);

  const enableGuestMode = useCallback((keys?: Partial<GuestKeys>) => {
    if (keys) {
      persistGuestKeys(keys);
      setGuestKeysState(keys);
    }
    persistGuestMode(true);
    setIsGuestMode(true);
  }, []);

  const exitGuestMode = useCallback(() => {
    clearGuestSession();
    setIsGuestMode(false);
    setGuestKeysState({});
  }, []);

  const value = useMemo(
    () => ({
      isGuestMode,
      guestKeys,
      setGuestKeys,
      enableGuestMode,
      exitGuestMode,
      isReady,
    }),
    [isGuestMode, guestKeys, setGuestKeys, enableGuestMode, exitGuestMode, isReady],
  );

  return (
    <GuestKeysContext.Provider value={value}>
      {children}
    </GuestKeysContext.Provider>
  );
}

export function useGuestKeys() {
  const ctx = useContext(GuestKeysContext);
  if (!ctx) {
    throw new Error("useGuestKeys must be used within GuestKeysProvider");
  }
  return ctx;
}
