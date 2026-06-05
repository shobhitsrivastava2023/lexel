import { polar } from "@/lib/polar";
import { isSubscriptionBypassedForRequest } from "@/lib/subscription-access";

export async function assertVoiceAgentSubscription(orgId: string) {
  if (await isSubscriptionBypassedForRequest()) {
    return;
  }

  try {
    const customerState = await polar.customers.getStateExternal({
      externalId: orgId,
    });
    const hasActiveSubscription =
      (customerState.activeSubscriptions ?? []).length > 0;
    if (!hasActiveSubscription) {
      throw new VoiceAgentSubscriptionError();
    }
  } catch (err) {
    if (err instanceof VoiceAgentSubscriptionError) throw err;
    throw new VoiceAgentSubscriptionError();
  }
}

export class VoiceAgentSubscriptionError extends Error {
  constructor() {
    super("SUBSCRIPTION_REQUIRED");
    this.name = "VoiceAgentSubscriptionError";
  }
}
