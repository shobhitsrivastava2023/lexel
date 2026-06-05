"use client";

import { useUser } from "@clerk/nextjs";
import { Headphones, ThumbsUp } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { isClerkConfiguredClient } from "@/lib/clerk-client";

function DashboardHeaderGuest() {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-xs text-muted-foreground sm:text-sm">
          Guest session
        </p>
        <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          Welcome
        </h1>
      </div>
    </div>
  );
}

function DashboardHeaderClerk() {
  const { isLoaded, user } = useUser();

  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-xs text-muted-foreground sm:text-sm">
          Nice to see you
        </p>
        <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
          {isLoaded ? (user?.fullName ?? user?.firstName ?? "there") : "..."}
        </h1>
      </div>

      <div className="hidden items-center gap-3 lg:flex">
        <Button variant="outline" size="sm" asChild>
          <Link href="mailto:business@codewithantonio.com">
            <ThumbsUp />
            <span className="hidden lg:block">Feedback</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="mailto:business@codewithantonio.com">
            <Headphones />
            <span className="hidden lg:block">Need help?</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function DashboardHeader() {
  if (!isClerkConfiguredClient()) {
    return <DashboardHeaderGuest />;
  }
  return <DashboardHeaderClerk />;
}
