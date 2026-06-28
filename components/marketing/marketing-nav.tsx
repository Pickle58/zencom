"use client";

import Link from "next/link";
import { Show, SignOutButton, OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/theme/mode-toggle";

export function MarketingNav() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold text-primary">
          Zencom
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/docs/install" className="text-muted-foreground hover:text-foreground">
            Install
          </Link>
          <ModeToggle />
          <Show when="signed-out">
            <Link href="/sign-in" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Sign in
            </Link>
            <Link href="/sign-up" className={cn(buttonVariants({ size: "sm" }))}>
              Get started
            </Link>
          </Show>
          <Show when="signed-in">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
            />
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Dashboard
            </Link>
            <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
              <Button variant="ghost" size="sm">
                Sign out
              </Button>
            </SignOutButton>
            <UserButton />
          </Show>
        </nav>
      </div>
    </header>
  );
}
