"use client";

import { useState } from "react";
import { KeyRound, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GuestContinueDialog } from "@/features/guest/components/guest-continue-dialog";
import { useGuestKeys } from "@/features/guest/components/guest-keys-provider";

export function GuestModeBanner() {
  const { isGuestMode, isReady, exitGuestMode } = useGuestKeys();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!isReady || !isGuestMode) return null;

  return (
    <>
      <div className="flex flex-col gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-amber-100/90 sm:text-sm">
          Guest mode — your API keys stay in this browser. Audio is ephemeral
          unless the host configured database storage.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-amber-500/30 bg-transparent text-xs"
            onClick={() => setDialogOpen(true)}
          >
            <KeyRound className="size-3.5" />
            Edit keys
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-amber-100/80"
            onClick={() => {
              exitGuestMode();
              window.location.href = "/landing";
            }}
          >
            <LogOut className="size-3.5" />
            Exit guest
          </Button>
        </div>
      </div>
      <GuestContinueDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        redirectOnSave={false}
      />
    </>
  );
}
