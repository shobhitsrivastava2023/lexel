import { Headphones, ThumbsUp } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-2 border-b px-3 py-3 sm:px-4 sm:py-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="size-9 shrink-0 sm:size-7" />
        <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
          {title}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
         <Button variant="outline" size="icon-sm" className="size-9 sm:size-8" asChild>
            <Link href="mailto:business@codewithantonio.com" aria-label="Send feedback">
              <ThumbsUp className="size-4" />
              <span className="sr-only">Feedback</span>
            </Link>
         </Button>
         <Button variant="outline" size="icon-sm" className="hidden size-9 sm:inline-flex sm:size-8" asChild>
          <Link href="mailto:business@codewithantonio.com" aria-label="Need help">
            <Headphones className="size-4" />
            <span className="sr-only">Need help</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};
