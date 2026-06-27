"use client";

import { useQuery } from "convex/react";
import { Authenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EmbedKeyPanel } from "@/components/dashboard/embed-key-panel";
import { Skeleton } from "@/components/ui/skeleton";

function SettingsContent() {
  const workspace = useQuery(api.workspaces.getCurrent, {});

  if (workspace === undefined) return <Skeleton className="h-32 w-full max-w-xl" />;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-muted-foreground text-sm">
        Workspace slug: <span className="font-medium text-foreground">/{workspace?.slug ?? "—"}</span>
      </p>
      <EmbedKeyPanel workspace={workspace} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <AuthLoading>
        <Skeleton className="h-32 w-full" />
      </AuthLoading>
      <Authenticated>
        <SettingsContent />
      </Authenticated>
    </>
  );
}
