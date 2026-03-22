import { auth } from "@clerk/nextjs/server";

import { env } from "@/lib/env";
import {
  assertVoiceAgentSubscription,
  VoiceAgentSubscriptionError,
} from "@/lib/voice-agent-access";
import { getFishVoiceAgentClient } from "@/lib/voice-agent/fish";

export const runtime = "nodejs";

const PAGE_SIZE = 100;
/** Avoid unbounded pagination if the API misbehaves. */
const MAX_PAGES = 20;

/** Voice agent dropdown: only Fish models whose title contains Sarah or Adrian (word match, case-insensitive). */
const ALLOWED_VOICE_TITLE =
  /\b(sarah|adrian)\b/i;

function isAllowedAgentVoiceTitle(title: string): boolean {
  return ALLOWED_VOICE_TITLE.test(title.trim());
}

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!env.FISH_API_KEY) {
    return Response.json(
      { error: "FISH_API_KEY is not configured", items: [] },
      { status: 503 },
    );
  }

  try {
    await assertVoiceAgentSubscription(orgId);
  } catch (e) {
    if (e instanceof VoiceAgentSubscriptionError) {
      return Response.json(
        { error: "SUBSCRIPTION_REQUIRED", items: [] },
        { status: 403 },
      );
    }
    throw e;
  }

  try {
    const client = getFishVoiceAgentClient();
    const merged = new Map<
      string,
      {
        id: string;
        title: string;
        description: string;
        coverImage: string;
        tags: string[];
        visibility: string;
        state: string;
      }
    >();

    for (let page = 1; page <= MAX_PAGES; page++) {
      const list = await client.voices.search({
        page_size: PAGE_SIZE,
        page_number: page,
        sort_by: "task_count",
      });

      const batch = list.items ?? [];
      if (batch.length === 0) break;

      for (const m of batch) {
        if (m.type !== "tts" || m.state !== "trained") continue;
        if (!m._id) continue;
        const displayTitle = m.title || "Untitled voice";
        if (!isAllowedAgentVoiceTitle(displayTitle)) continue;
        if (!merged.has(m._id)) {
          merged.set(m._id, {
            id: m._id,
            title: displayTitle,
            description: m.description ?? "",
            coverImage: m.cover_image ?? "",
            tags: Array.isArray(m.tags) ? m.tags : [],
            visibility: m.visibility ?? "unknown",
            state: m.state,
          });
        }
      }

      if (batch.length < PAGE_SIZE) break;
    }

    const items = [...merged.values()].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );

    return Response.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list voices";
    return Response.json({ error: message, items: [] }, { status: 502 });
  }
}
