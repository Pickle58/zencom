"use client";

import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/mode-toggle";

export function SessionTaskShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <Link href="/" className="text-lg font-semibold text-primary">
          Zencom
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
          <Button variant="outline" size="sm">
            Sign out
          </Button>
          </SignOutButton>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        {children}
      </main>
    </div>
  );
}
