import { cn } from "@/lib/utils";

/** Sidebar mark for Voice agent — letter “A” in a small badge (reads as “Agent”). */
export function VoiceAgentNavIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-sidebar-foreground/30 bg-sidebar-accent font-bold leading-none tracking-tight text-sidebar-foreground",
        className,
      )}
      style={{ fontSize: "0.625rem" }}
      aria-hidden
    >
      A
    </span>
  );
}
