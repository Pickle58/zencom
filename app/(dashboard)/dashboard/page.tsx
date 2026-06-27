"use client";

import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { EmbedKeyPanel } from "@/components/dashboard/embed-key-panel";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function DashboardContent() {
  const workspace = useQuery(api.workspaces.getCurrent, {});

  if (workspace === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full max-w-lg" />
      </div>
    );
  }

  if (workspace === null) {
    return <p className="text-muted-foreground">Workspace not found.</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{workspace.name}</h1>
        <p className="text-muted-foreground text-sm">/{workspace.slug}</p>
        <p className="text-muted-foreground text-sm">
          Created {new Date(workspace.createdAt).toLocaleDateString()}
        </p>
      </div>
      <EmbedKeyPanel workspace={workspace} showSnippet={false} />
      <div className="flex gap-3">
        <Link href="/dashboard/inbox" className={cn(buttonVariants())}>
          Open inbox
        </Link>
        <Link
          href="/dashboard/install"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Install widget
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <AuthLoading>
        <Skeleton className="h-8 w-48" />
      </AuthLoading>
      <Unauthenticated>
        <p>Please sign in to access the dashboard.</p>
      </Unauthenticated>
      <Authenticated>
        <DashboardContent />
      </Authenticated>
    </>
  );
}
