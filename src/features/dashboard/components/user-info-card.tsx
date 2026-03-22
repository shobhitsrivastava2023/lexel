"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

const chartConfig = {
  count: {
    label: "Generations",
    /** LEXEL / Spotify-style accent so the area reads clearly on dark cards */
    color: "#1db954",
  },
} satisfies ChartConfig;

export function UserInfoCard() {
  const trpc = useTRPC();
  const { data: generations = [] } = useQuery(
    trpc.generations.getAll.queryOptions(),
  );
  const { data: billing } = useQuery(
    trpc.billing.getStatus.queryOptions(),
  );

  const chartData = useMemo(() => {
    const now = new Date();
    const days: { day: string; short: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayKey = d.toISOString().slice(0, 10);
      const count = generations.filter((g) => {
        const created = new Date(g.createdAt);
        created.setHours(0, 0, 0, 0);
        return created.getTime() === d.getTime();
      }).length;
      days.push({
        day: dayKey,
        short: format(d, "EEE"),
        count,
      });
    }
    return days;
  }, [generations]);

  const totalGenerations = generations.length;
  const isLoading = !generations || billing === undefined;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-[#0f0f0f]/95 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
        <div className="px-5 py-5 lg:px-6 lg:py-6">
          <div className="mb-4">
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-1 h-4 w-full max-w-xs" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <div className="mt-5">
            <Skeleton className="mb-3 h-3 w-20" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-[#0f0f0f]/95 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
      <div className="px-5 py-5 lg:px-6 lg:py-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/90">
              Usage & activity
            </p>
            <h2 className="mt-1.5 text-base font-semibold tracking-tight text-foreground lg:text-lg">
              Your voice activity at a glance
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground/90">
              Generations and estimated cost this period.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/6 bg-black/20 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
              Total generations
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {totalGenerations}
            </p>
          </div>
          <div className="rounded-xl border border-white/6 bg-black/20 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
              Estimated cost
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {billing?.subscriptionBypassed
                ? "—"
                : formatCurrency(billing?.estimatedCostCents ?? 0)}
            </p>
            {!billing?.subscriptionBypassed && (
              <p className="text-[11px] text-muted-foreground/80">
                This period
              </p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
            Last 7 days
          </p>
          <ChartContainer config={chartConfig} className="h-40 w-full">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="fillCount"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.55}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.06}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 2"
                vertical={false}
                className="stroke-border/50"
              />
              <XAxis
                dataKey="short"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <YAxis
                dataKey="count"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-count)"
                strokeWidth={2}
                fill="url(#fillCount)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
