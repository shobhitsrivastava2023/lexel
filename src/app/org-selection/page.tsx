import { OrganizationList } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { isClerkConfigured } from "@/lib/app-config";

export const dynamic = "force-dynamic";

export default function OrgSelectionPage() {
  if (!isClerkConfigured()) {
    redirect("/landing");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <OrganizationList
        hidePersonal
        afterCreateOrganizationUrl="/"
        afterSelectOrganizationUrl="/"
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
