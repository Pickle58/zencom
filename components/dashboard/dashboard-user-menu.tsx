"use client";

import { OrganizationSwitcher, SignOutButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function DashboardUserMenu() {
  return (
    <div className="ml-auto flex items-center gap-2">
      <OrganizationSwitcher
        hidePersonal
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
        appearance={{
          elements: {
            organizationSwitcherTrigger: "text-sm",
          },
        }}
      />
      <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
          Sign out
        </Button>
      </SignOutButton>
      <UserButton
        showName
        appearance={{
          elements: {
            userButtonOuterIdentifier: "text-sm font-medium",
          },
        }}
      />
    </div>
  );
}
