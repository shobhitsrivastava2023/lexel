import type { Metadata } from "next";

import { VoiceAgentView } from "@/features/voice-agent/views/voice-agent-view";

export const metadata: Metadata = { title: "Voice agent" };

export default function VoiceAgentPage() {
  return <VoiceAgentView />;
}
