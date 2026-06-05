"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { GuestContinueDialog } from "@/features/guest/components/guest-continue-dialog";

type LandingActionsProps = {
  signInUrl: string;
  showSignIn?: boolean;
};

export function LandingActions({
  signInUrl,
  showSignIn = true,
}: LandingActionsProps) {
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);

  return (
    <>
      <div className="flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
        {showSignIn ? (
          <Button asChild size="lg" className="h-11 w-full px-8 sm:w-auto">
            <Link href={signInUrl}>Sign in</Link>
          </Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          variant={showSignIn ? "outline" : "default"}
          className="h-11 w-full px-8 sm:w-auto"
          onClick={() => setGuestDialogOpen(true)}
        >
          Continue as guest
        </Button>
      </div>

      {showSignIn ? (
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      ) : (
        <p className="max-w-md text-sm text-muted-foreground">
          This is a bring-your-own-keys demo. Continue as guest, paste your API
          keys, and try text-to-speech in your browser.
        </p>
      )}

      <GuestContinueDialog
        open={guestDialogOpen}
        onOpenChange={setGuestDialogOpen}
      />
    </>
  );
}
