import { Polar } from "@polar-sh/sdk";

import { isPolarConfigured } from "@/lib/app-config";
import { env } from "./env";

let polarClient: Polar | null = null;

export function getPolarClient() {
  if (!isPolarConfigured()) {
    return null;
  }

  if (!polarClient) {
    polarClient = new Polar({
      accessToken: env.POLAR_ACCESS_TOKEN!,
      server: env.POLAR_SERVER,
    });
  }

  return polarClient;
}

/** @deprecated Prefer getPolarClient() */
export const polar = new Proxy({} as Polar, {
  get(_target, prop) {
    const client = getPolarClient();
    if (!client) {
      throw new Error("Polar billing is not configured on this deployment.");
    }
    const value = client[prop as keyof Polar];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
