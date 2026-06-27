"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CreditCard,
  Inbox,
  LayoutDashboard,
  Palette,
  Settings,
  UserPlus,
  Wrench,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox, badge: "unread" as const },
  { href: "/dashboard/leads", label: "Leads", icon: UserPlus },
  { href: "/dashboard/kb", label: "Knowledge base", icon: BookOpen },
  { href: "/dashboard/customize", label: "Customize", icon: Palette },
  { href: "/dashboard/install", label: "Install", icon: Wrench },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { orgId, isLoaded: isClerkLoaded } = useAuth();
  const { isAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const convexOrgId = useQuery(
    api.sessionAuth.getActiveOrgId,
    isClerkLoaded && !!orgId && !isConvexAuthLoading && isAuthenticated
      ? {}
      : "skip",
  );
  const canLoadOrgData = typeof convexOrgId === "string";
  const conversations = useQuery(
    api.conversations.list,
    canLoadOrgData ? { filter: "unread" } : "skip",
  );
  const unreadCount = conversations?.length ?? 0;

  return (
    <Sidebar>
      <SidebarHeader className="gap-3 p-4">
        <span className="text-lg font-semibold">Zencom</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                  >
                    <item.icon />
                    <span className="flex flex-1 items-center justify-between">
                      {item.label}
                      {item.badge === "unread" && unreadCount > 0 ? (
                        <Badge className="ml-auto">{unreadCount}</Badge>
                      ) : null}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
