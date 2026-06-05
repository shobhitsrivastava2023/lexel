"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

import { GuestKeysProvider } from "@/features/guest/components/guest-keys-provider";
import { TRPCReactProvider } from "@/trpc/client";

export function AppProviders({ children }: { children: ReactNode }) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() || undefined;

  const inner = (
    <GuestKeysProvider>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </GuestKeysProvider>
  );

  if (!publishableKey) {
    return inner;
  }

  return <ClerkProvider publishableKey={publishableKey}>{inner}</ClerkProvider>;
}
