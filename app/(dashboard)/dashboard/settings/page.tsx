"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Authenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

function SettingsContent() {
  const ensureCurrent = useMutation(api.workspaces.ensureCurrent);
  const workspace = useQuery(api.workspaces.getCurrent, {});
  const [embedKey, setEmbedKey] = useState<string | null>(null);

  useEffect(() => {
    void ensureCurrent({}).then((result) => {
      if (result.embedKeyPlaintext) setEmbedKey(result.embedKeyPlaintext);
    });
  }, [ensureCurrent]);

  if (workspace === undefined) return <Skeleton className="h-32 w-full max-w-xl" />;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const key = embedKey ?? "YOUR_EMBED_KEY";
  const snippet = `<script src="${origin}/embed.js" data-key="${key}" async></script>`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-muted-foreground text-sm">
        Workspace slug: <span className="font-medium text-foreground">/{workspace?.slug ?? "—"}</span>
      </p>
      <div className="space-y-2">
        <p className="text-sm font-medium">Install snippet</p>
        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs">{snippet}</pre>
      </div>
      <p className="text-muted-foreground text-sm">
        Embed key prefix: {workspace?.embedKeyPrefix ?? "—"}
      </p>
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
