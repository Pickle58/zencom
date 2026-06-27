"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function DashboardContent() {
  const ensureCurrent = useMutation(api.workspaces.ensureCurrent);
  const [embedKey, setEmbedKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void ensureCurrent({}).then((result) => {
      if (result.embedKeyPlaintext) {
        setEmbedKey(result.embedKeyPlaintext);
      }
      setReady(true);
    });
  }, [ensureCurrent]);

  const workspace = useQuery(
    api.workspaces.getCurrent,
    ready ? {} : "skip",
  );

  if (!ready || workspace === undefined) {
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
      {embedKey ? (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="mb-2 font-medium">Save your embed key — shown once:</p>
          <code className="block break-all rounded bg-background p-2">{embedKey}</code>
        </div>
      ) : null}
      <div className="flex gap-3">
        <Link href="/dashboard/inbox" className={cn(buttonVariants())}>
          Open inbox
        </Link>
        <Link
          href="/dashboard/settings"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Settings
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
