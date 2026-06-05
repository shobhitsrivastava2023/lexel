import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { isClerkConfigured } from "@/lib/app-config";
import { safePostAuthRedirectPath } from "@/lib/safe-clerk-redirect";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  if (!isClerkConfigured()) {
    redirect("/landing");
  }

  const { redirect_url } = await searchParams;
  const fallbackRedirectUrl = safePostAuthRedirectPath(redirect_url);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl={fallbackRedirectUrl}
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
      />
    </div>
  );
}
