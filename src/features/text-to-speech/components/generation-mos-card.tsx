"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type MosMetricKey = "overall" | "naturalness" | "clarity" | "intelligibility";

type MosScores = Record<MosMetricKey, number>;

const MOS_METRICS: Array<{
  key: MosMetricKey;
  label: string;
  description: string;
}> = [
  {
    key: "overall",
    label: "Overall quality",
    description: "Your overall impression of the generated speech.",
  },
  {
    key: "naturalness",
    label: "Naturalness",
    description: "How human-like and smooth the speech sounds.",
  },
  {
    key: "clarity",
    label: "Clarity",
    description: "How clear and easy the words are to hear.",
  },
  {
    key: "intelligibility",
    label: "Intelligibility",
    description: "How easy it is to understand the spoken message.",
  },
];

const DEFAULT_SCORES: MosScores = {
  overall: 0,
  naturalness: 0,
  clarity: 0,
  intelligibility: 0,
};

function formatAverage(value: number | null): string {
  return value === null ? "-" : value.toFixed(1);
}

function ScoreButtons({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((score) => {
        const isSelected = value === score;

        return (
          <Button
            key={score}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            disabled={disabled}
            onClick={() => onChange(score)}
            className={cn("min-w-10", isSelected && "shadow-none")}
            aria-pressed={isSelected}
          >
            {score}
          </Button>
        );
      })}
    </div>
  );
}

export function GenerationMosCard({
  generationId,
}: {
  generationId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const ratingsQuery = useQuery(
    trpc.ratings.getForGeneration.queryOptions({ generationId }),
  );

  const upsertMutation = useMutation(
    trpc.ratings.upsertForGeneration.mutationOptions({
      onSuccess: async () => {
        toast.success("MOS rating saved");
        await queryClient.invalidateQueries({
          queryKey: trpc.ratings.getForGeneration.queryKey({ generationId }),
        });
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to save MOS rating");
      },
    }),
  );

  const summary = ratingsQuery.data?.summary;

  return (
    <div className="shrink-0 border-t p-4 lg:p-6">
      <Card className="gap-0">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Mean Opinion Score Evaluation</CardTitle>
            <CardDescription>
              Rate this generated audio to measure perceived speech quality and
              intelligibility.
            </CardDescription>
          </div>
          {ratingsQuery.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-18 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Ratings</p>
                <p className="mt-1 text-2xl font-semibold">
                  {summary?.count ?? 0}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Overall</p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatAverage(summary?.overall ?? null)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Clarity</p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatAverage(summary?.clarity ?? null)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Intelligibility</p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatAverage(summary?.intelligibility ?? null)}
                </p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <GenerationMosForm
            key={
              ratingsQuery.data?.viewerRating?.updatedAt?.toISOString() ??
              `${generationId}-new`
            }
            generationId={generationId}
            viewerRating={ratingsQuery.data?.viewerRating ?? null}
            onSubmit={(input) => upsertMutation.mutate(input)}
            isSubmitting={upsertMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function GenerationMosForm({
  generationId,
  viewerRating,
  onSubmit,
  isSubmitting,
}: {
  generationId: string;
  viewerRating: {
    overall: number;
    naturalness: number;
    clarity: number;
    intelligibility: number;
    comment: string | null;
  } | null;
  onSubmit: (input: {
    generationId: string;
    overall: number;
    naturalness: number;
    clarity: number;
    intelligibility: number;
    comment?: string;
  }) => void;
  isSubmitting: boolean;
}) {
  const [scores, setScores] = useState<MosScores>(() =>
    viewerRating
      ? {
          overall: viewerRating.overall,
          naturalness: viewerRating.naturalness,
          clarity: viewerRating.clarity,
          intelligibility: viewerRating.intelligibility,
        }
      : DEFAULT_SCORES,
  );
  const [comment, setComment] = useState(() => viewerRating?.comment ?? "");

  const hasExistingRating = Boolean(viewerRating);
  const hasIncompleteScores = MOS_METRICS.some(({ key }) => scores[key] < 1);

  const handleSubmit = () => {
    if (hasIncompleteScores) {
      toast.error("Please rate all MOS criteria before submitting");
      return;
    }

    onSubmit({
      generationId,
      overall: scores.overall,
      naturalness: scores.naturalness,
      clarity: scores.clarity,
      intelligibility: scores.intelligibility,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <FieldGroup className="gap-6">
      {MOS_METRICS.map((metric) => (
        <Field key={metric.key}>
          <FieldLabel>{metric.label}</FieldLabel>
          <FieldDescription>{metric.description}</FieldDescription>
          <ScoreButtons
            value={scores[metric.key]}
            disabled={isSubmitting}
            onChange={(value) =>
              setScores((current) => ({
                ...current,
                [metric.key]: value,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            1 = Poor, 3 = Acceptable, 5 = Excellent
          </p>
        </Field>
      ))}

      <Field>
        <FieldLabel htmlFor="mos-comment">Optional feedback</FieldLabel>
        <FieldDescription>
          Add notes about pronunciation, naturalness, or ease of understanding.
        </FieldDescription>
        <Textarea
          id="mos-comment"
          value={comment}
          maxLength={500}
          disabled={isSubmitting}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Example: Clear speech, but the pacing felt slightly too fast."
        />
        <p className="text-xs text-muted-foreground">
          {comment.length} / 500 characters
        </p>
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {hasExistingRating
            ? "Your previous MOS evaluation can be updated anytime."
            : "Submit your MOS evaluation after listening to the audio."}
        </p>
        <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
          {isSubmitting
            ? "Saving..."
            : hasExistingRating
              ? "Update MOS Rating"
              : "Submit MOS Rating"}
        </Button>
      </div>
    </FieldGroup>
  );
}
