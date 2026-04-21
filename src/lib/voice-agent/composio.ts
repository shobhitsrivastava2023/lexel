import "server-only";

import { Composio } from "@composio/core";
import { z } from "zod";

import { env } from "@/lib/env";

const ALLOWED_TOOL_PREFIXES = ["NOTION_", "GOOGLEDOCS_", "GOOGLEDRIVE_"] as const;
const RETRYABLE_ERROR_RE =
  /init|initialize|temporar|timeout|timed out|429|rate limit|ECONN|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|5\d\d/i;

let composioClient: Composio | null = null;

function isAllowedToolSlug(slug: string) {
  return ALLOWED_TOOL_PREFIXES.some((prefix) => slug.startsWith(prefix));
}

function isRetryableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return RETRYABLE_ERROR_RE.test(message);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function getComposioClient() {
  if (!env.COMPOSIO_API_KEY) {
    throw new Error(
      "Composio is not configured. Set COMPOSIO_API_KEY to enable agent tools.",
    );
  }
  if (!composioClient) {
    composioClient = new Composio({
      apiKey: env.COMPOSIO_API_KEY,
    });
  }
  return composioClient;
}

const executeToolArgsSchema = z.object({
  slug: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
  connectedAccountId: z.string().min(1).optional(),
});

export type ExecuteToolArgs = z.infer<typeof executeToolArgsSchema>;

export function parseExecuteToolArgs(rawArgs: string): ExecuteToolArgs {
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(rawArgs);
  } catch {
    throw new Error("Tool arguments are not valid JSON.");
  }
  const args = executeToolArgsSchema.parse(parsed);
  if (!isAllowedToolSlug(args.slug)) {
    throw new Error(
      `Tool "${args.slug}" is not allowed. Use Notion, Google Docs, or Google Drive tools only.`,
    );
  }
  return args;
}

export async function executeComposioToolWithRetry(
  userId: string,
  args: ExecuteToolArgs,
) {
  const maxAttempts = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const composio = getComposioClient();
      const result = await composio.tools.execute(args.slug, {
        userId,
        connectedAccountId:
          args.connectedAccountId ?? env.COMPOSIO_CONNECTED_ACCOUNT_ID,
        arguments: args.arguments,
        dangerouslySkipVersionCheck: true,
      });
      return result;
    } catch (error) {
      lastError = error;
      // Force re-init on next attempt if SDK/client got into bad state.
      composioClient = null;
      if (attempt >= maxAttempts || !isRetryableError(error)) {
        break;
      }
      await wait(300 * attempt);
    }
  }

  throw (
    lastError ??
    new Error("Composio tool execution failed after retries.")
  );
}

export const OPENAI_COMPOSIO_TOOL = {
  type: "function" as const,
  function: {
    name: "composio_execute_tool",
    description:
      "Execute a third-party action via Composio. Allowed tools are only Notion (NOTION_*), Google Docs (GOOGLEDOCS_*), and Google Drive (GOOGLEDRIVE_*). Use this for creating docs, writing analysis, uploading files, and related actions.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        slug: {
          type: "string",
          description:
            "Exact Composio tool slug, such as NOTION_*, GOOGLEDOCS_*, or GOOGLEDRIVE_*.",
        },
        arguments: {
          type: "object",
          additionalProperties: true,
          description:
            "Arguments for the selected tool based on the tool schema.",
        },
        connectedAccountId: {
          type: "string",
          description:
            "Optional Composio connected account ID. If omitted, backend default may be used.",
        },
      },
      required: ["slug", "arguments"],
    },
  },
};

