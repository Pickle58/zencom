"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Authenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EmbedKeyPanel } from "@/components/dashboard/embed-key-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { BRAND_WIDGET_COLOR } from "@/lib/brand";

/** Reference snippet — proactive attrs are added automatically when enabled in Customize. */
function buildEmbedSnippetOptional(origin: string) {
  return `<!-- Optional proactive attrs (add to script tag when enabled in Customize):
  data-proactive-enabled="true"
  data-proactive-delay="5000"
  data-proactive-message="Hi! How can we help?"
-->
<script
  src="${origin}/embed.js"
  data-key="YOUR_EMBED_KEY"
  data-title="Chat with us"
  data-color="${BRAND_WIDGET_COLOR}"
  data-position="bottom-right"
  data-border-radius="12"
  async
></script>`;
}

function InstallContent() {
  const workspace = useQuery(api.workspaces.getCurrent, {});
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (workspace === undefined) return <Skeleton className="h-32 w-full max-w-xl" />;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Install widget</h1>
        <p className="text-muted-foreground text-sm">
          Add Zencom to your site and start receiving conversations.
        </p>
      </div>
      <ol className="list-decimal space-y-4 pl-5 text-sm">
        <li>Copy the embed snippet below and paste it before the closing body tag on your site.</li>
        <li>
          Customize widget appearance in{" "}
          <Link href="/dashboard/customize" className="underline">
            Customize
          </Link>{" "}
          or manage your embed key in{" "}
          <Link href="/dashboard/settings" className="underline">
            Settings
          </Link>
          .
        </li>
        <li>
          After installing, open{" "}
          <Link href="/dashboard/inbox" className="underline">
            Inbox
          </Link>{" "}
          to reply to visitors in real time.
        </li>
      </ol>
      <EmbedKeyPanel workspace={workspace} />
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Optional embed attributes</summary>
        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs">
          {buildEmbedSnippetOptional(origin)}
        </pre>
        <p className="text-muted-foreground mt-2 text-xs">
          Proactive attributes are included in your copied snippet when enabled in Customize.
        </p>
      </details>
      <Link href="/docs/install" className="text-sm underline">
        View public install guide
      </Link>
    </div>
  );
}

export default function InstallPage() {
  return (
    <>
      <AuthLoading>
        <Skeleton className="h-32 w-full" />
      </AuthLoading>
      <Authenticated>
        <InstallContent />
      </Authenticated>
    </>
  );
}
