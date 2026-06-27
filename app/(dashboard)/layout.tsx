import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardUserMenu } from "@/components/dashboard/dashboard-user-menu";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-muted-foreground">Agent dashboard</span>
            <DashboardUserMenu />
          </header>
          <div className="flex flex-1 flex-col p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardShell>
  );
}
