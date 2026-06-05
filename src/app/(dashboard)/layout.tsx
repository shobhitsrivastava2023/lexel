import { cookies } from "next/headers";

import { 
  SidebarInset, 
  SidebarProvider
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import { GuestModeBanner } from "@/features/guest/components/guest-mode-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-svh">
      <SidebarInset className="min-h-0 min-w-0 overflow-x-hidden">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
          <GuestModeBanner />
          {children}
        </main>
      </SidebarInset>
      <DashboardSidebar />
    </SidebarProvider>
  )
};