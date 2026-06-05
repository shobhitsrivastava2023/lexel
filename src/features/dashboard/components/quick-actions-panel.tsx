 "use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { quickActions } from "@/features/dashboard/data/quick-actions";
import { Button } from "@/components/ui/button";
import { QuickActionCard } from "@/features/dashboard/components/quick-action-card";

export function QuickActionsPanel() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateScrollState = () => {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      setCanScrollPrev(el.scrollLeft > 2);
      setCanScrollNext(el.scrollLeft < maxScroll - 2);
      setScrollProgress(maxScroll === 0 ? 0 : el.scrollLeft / maxScroll);
    };

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const scrollByAmount = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 240, behavior: "smooth" });
  };

  return (
    <div className="min-w-0 space-y-3.5">
      <h2 className="text-base font-semibold tracking-tight sm:text-lg">
        Quick actions
      </h2>
      <div
        ref={scrollRef}
        className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-max gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              imageSrc={action.imageSrc}
              href={action.href}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => scrollByAmount(-1)}
          disabled={!canScrollPrev}
          className="size-9 rounded-full border border-white/10 bg-white/5 text-foreground/85 transition-colors hover:bg-white/10 disabled:opacity-35 sm:size-8"
          aria-label="Scroll quick actions left"
        >
          <ChevronLeft className="size-4 sm:size-3.5" />
        </Button>
        <div className="relative h-2 flex-1 rounded-full bg-white/[0.08]">
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/55 transition-[left] duration-200"
            style={{
              width: "24%",
              left: `${scrollProgress * 76}%`,
            }}
          />
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => scrollByAmount(1)}
          disabled={!canScrollNext}
          className="size-9 rounded-full border border-white/10 bg-white/5 text-foreground/85 transition-colors hover:bg-white/10 disabled:opacity-35 sm:size-8"
          aria-label="Scroll quick actions right"
        >
          <ChevronRight className="size-4 sm:size-3.5" />
        </Button>
      </div>
    </div>
  );
};
