import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { QuickAction } from "@/features/dashboard/data/quick-actions";

type QuickActionCardProps = QuickAction;

export function QuickActionCard({
  title,
  description,
  imageSrc,
  href,
}: QuickActionCardProps) {
  return (
    <div className="group flex w-[190px] flex-col gap-3 rounded-xl bg-[#181818] p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.7)]">
      {/* Cover artwork */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#111111]">
        <Image
          src={imageSrc}
          alt={title}
          fill
          priority={false}
          sizes="(min-width: 1024px) 190px, 45vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-inset ring-white/10" />

        {/* Play / action button */}
        <Button
          size="icon"
          className="absolute right-2 bottom-2 h-9 w-9 translate-y-3 rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
          asChild
        >
          <Link href={href}>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {/* Text content */}
      <div className="space-y-1">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {title}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
};