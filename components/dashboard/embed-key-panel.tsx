"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { BRAND_WIDGET_COLOR } from "@/lib/brand";

function embedKeyStorageKey(clerkOrgId: string) {
  return `zencom_embed_key:${clerkOrgId}`;
}

function embedKeyMatchesPrefix(embedKey: string, embedKeyPrefix: string | undefined) {
  return Boolean(embedKeyPrefix && embedKey.slice(0, 12) === embedKeyPrefix);
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildSnippet(
  origin: string,
  embedKey: string,
  widget: Doc<"workspaces">["widgetSettings"] | undefined,
) {
  const attrs = [
    `src="${escapeHtmlAttr(`${origin}/embed.js`)}"`,
    `data-key="${escapeHtmlAttr(embedKey)}"`,
    `data-title="${escapeHtmlAttr(widget?.title ?? "Chat")}"`,
    `data-color="${escapeHtmlAttr(widget?.primaryColor ?? BRAND_WIDGET_COLOR)}"`,
    `data-position="${escapeHtmlAttr(widget?.position ?? "bottom-right")}"`,
  ];

  if (widget?.borderRadius != null) {
    attrs.push(`data-border-radius="${escapeHtmlAttr(String(widget.borderRadius))}"`);
  }

  if (widget?.proactiveEnabled) {
    attrs.push(`data-proactive-enabled="true"`);
    attrs.push(
      `data-proactive-delay="${escapeHtmlAttr(String(widget.proactiveDelayMs ?? 5000))}"`,
    );
    attrs.push(
      `data-proactive-message="${escapeHtmlAttr(widget.proactiveMessage ?? "Hi! How can we help?")}"`,
    );
  }

  return `<script ${attrs.join(" ")} async></script>`;
}

type EmbedKeyPanelProps = {
  workspace: {
    embedKeyPrefix?: string;
    widgetSettings?: Doc<"workspaces">["widgetSettings"];
  } | null | undefined;
  showSnippet?: boolean;
};

export function EmbedKeyPanel({ workspace, showSnippet = true }: EmbedKeyPanelProps) {
  const { orgId } = useAuth();
  const ensureCurrent = useMutation(api.workspaces.ensureCurrent);
  const rotateEmbedKey = useMutation(api.workspaces.rotateEmbedKey);
  const [embedKeyOverride, setEmbedKeyOverride] = useState<{
    orgId: string;
    key: string;
  } | null>(null);
  const [copied, setCopied] = useState<"key" | "snippet" | null>(null);
  const [rotating, setRotating] = useState(false);

  const storedEmbedKey =
    orgId && typeof window !== "undefined"
      ? sessionStorage.getItem(embedKeyStorageKey(orgId))
      : null;
  const scopedOverride =
    orgId && embedKeyOverride?.orgId === orgId ? embedKeyOverride.key : null;
  const candidateEmbedKey = scopedOverride ?? storedEmbedKey;
  const embedKey =
    candidateEmbedKey &&
    embedKeyMatchesPrefix(candidateEmbedKey, workspace?.embedKeyPrefix)
      ? candidateEmbedKey
      : null;

  const persistKey = useCallback(
    (key: string) => {
      if (!orgId) return;
      setEmbedKeyOverride({ orgId, key });
      sessionStorage.setItem(embedKeyStorageKey(orgId), key);
    },
    [orgId],
  );

  useEffect(() => {
    setEmbedKeyOverride(null);
    if (!orgId) return;

    void ensureCurrent({}).then((result) => {
      if (result.embedKeyPlaintext) {
        persistKey(result.embedKeyPlaintext);
      }
    });
  }, [orgId, ensureCurrent, persistKey]);

  useEffect(() => {
    if (!orgId || !workspace?.embedKeyPrefix || typeof window === "undefined") return;

    const storageKey = embedKeyStorageKey(orgId);
    const stored = sessionStorage.getItem(storageKey);
    if (stored && !embedKeyMatchesPrefix(stored, workspace.embedKeyPrefix)) {
      sessionStorage.removeItem(storageKey);
      setEmbedKeyOverride(null);
    }
  }, [orgId, workspace?.embedKeyPrefix]);

  async function handleRotate() {
    setRotating(true);
    try {
      const key = await rotateEmbedKey({});
      persistKey(key);
    } finally {
      setRotating(false);
    }
  }

  async function handleCopy(text: string, kind: "key" | "snippet") {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const snippet =
    embedKey && workspace
      ? buildSnippet(origin, embedKey, workspace.widgetSettings)
      : null;

  return (
    <div className="flex flex-col gap-4">
      {embedKey ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="mb-2 font-medium">Embed key</p>
          <p className="text-muted-foreground mb-3 text-xs">
            Copy and store this key now. It is not shown again after you leave this session
            unless you generate a new one.
          </p>
          <code className="mb-3 block break-all rounded bg-background p-2 text-xs">{embedKey}</code>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void handleCopy(embedKey, "key")}
            >
              {copied === "key" ? "Copied!" : "Copy key"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={rotating}
              onClick={() => void handleRotate()}
            >
              {rotating ? "Generating…" : "Generate new key"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="mb-2 font-medium">Embed key not available</p>
          <p className="text-muted-foreground mb-3 text-xs">
            {candidateEmbedKey
              ? "Your saved embed key is outdated (for example after generating a new key). Generate a fresh key and update any sites still using the old snippet."
              : "Your workspace was provisioned automatically. Generate an embed key to install the widget."}{" "}
            Active prefix:{" "}
            <span className="font-mono text-foreground">{workspace?.embedKeyPrefix ?? "—"}</span>
          </p>
          <Button type="button" size="sm" disabled={rotating} onClick={() => void handleRotate()}>
            {rotating ? "Generating…" : "Generate embed key"}
          </Button>
        </div>
      )}

      {showSnippet && snippet ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Install snippet</p>
          <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs">{snippet}</pre>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleCopy(snippet, "snippet")}
          >
            {copied === "snippet" ? "Copied!" : "Copy snippet"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
