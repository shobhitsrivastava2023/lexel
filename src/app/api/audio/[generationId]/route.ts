import { getAppAuth } from "@/lib/clerk-app-auth";
import { isPersistenceConfigured } from "@/lib/app-config";
import { getPrismaClient } from "@/lib/db";
import { getSignedAudioUrl } from "@/lib/r2";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ generationId: string }> },
) {
  const { userId, orgId } = await getAppAuth();

  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isPersistenceConfigured()) {
    return new Response("Persistence is not configured on this deployment", {
      status: 503,
    });
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return new Response("Database is not configured", { status: 503 });
  }

  const { generationId } = await params;

  const generation = await prisma.generation.findUnique({
    where: { id: generationId, orgId },
  });

  if (!generation) {
    return new Response("Not found", { status: 404 });
  }

  if (!generation.r2ObjectKey) {
    return new Response("Audio is not available yet", { status: 409 });
  }

  const signedUrl = await getSignedAudioUrl(generation.r2ObjectKey);
  const audioResponse = await fetch(signedUrl);

  if (!audioResponse.ok) {
    return new Response("Failed to fetch audio", { status: 502 });
  }

  return new Response(audioResponse.body, {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "private, max-age=3600",
    },
  });
};
