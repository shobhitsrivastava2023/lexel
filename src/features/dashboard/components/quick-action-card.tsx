import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import type { QuickAction } from "@/features/dashboard/data/quick-actions";

type QuickActionCardProps = QuickAction;

export function QuickActionCard({
  title,
  description,
  imageSrc,
  href,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex w-[min(72vw,190px)] shrink-0 snap-start flex-col gap-3 rounded-xl bg-[#181818] p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.7)] sm:w-[190px]"
    >
      {/* Cover artwork */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#111111]">
        <Image
          src={imageSrc}
          alt={title}
          fill
          priority={false}
          sizes="(min-width: 640px) 190px, 72vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-inset ring-white/10" />

        {/* Play / action button — always visible on touch; hover reveal on desktop */}
        <span className="absolute right-2 bottom-2 inline-flex h-9 w-9 translate-y-0 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-100 shadow-lg transition-all duration-200 lg:translate-y-3 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
          <ArrowRight className="size-4" />
        </span>
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
    </Link>
  )
};