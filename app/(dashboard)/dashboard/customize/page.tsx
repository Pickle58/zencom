"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Doc } from "@/convex/_generated/dataModel";

type WidgetSettings = Doc<"workspaces">["widgetSettings"];

export default function CustomizePage() {
  const settings = useQuery(api.widgetSettings.get, {});
  const workspace = useQuery(api.workspaces.getCurrent, {});
  const updateSettings = useMutation(api.widgetSettings.update);

  const [localDraft, setLocalDraft] = useState<WidgetSettings | null>(null);
  const draft = localDraft ?? settings;

  if (!draft || !workspace) {
    return <p className="text-muted-foreground text-sm">Loading customizer...</p>;
  }

  function updateDraft(patch: Partial<WidgetSettings>) {
    setLocalDraft({ ...draft, ...patch } as WidgetSettings);
  }

  const proactivePreviewMessage =
    draft.proactiveMessage?.trim() || "Hi! How can we help?";

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Widget customizer</h1>
          <p className="text-muted-foreground text-sm">Appearance and behavior for your embed.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Primary color</Label>
              <Input
                type="color"
                value={draft.primaryColor}
                onChange={(e) => updateDraft({ primaryColor: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Border radius</Label>
              <Input
                type="number"
                value={draft.borderRadius ?? 12}
                onChange={(e) => updateDraft({ borderRadius: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>FAQ shortcuts (one per line)</Label>
              <Textarea
                rows={4}
                value={(draft.faqShortcuts ?? []).join("\n")}
                onChange={(e) =>
                  updateDraft({ faqShortcuts: e.target.value.split("\n").filter(Boolean) })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Position</Label>
              <Select
                value={draft.position}
                onValueChange={(value) =>
                  updateDraft({ position: value as WidgetSettings["position"] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom right</SelectItem>
                  <SelectItem value="bottom-left">Bottom left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.leadCaptureEnabled ?? false}
                  onChange={(e) => updateDraft({ leadCaptureEnabled: e.target.checked })}
                />
                Enable lead capture
              </label>
              {draft.leadCaptureEnabled ? (
                <label className="flex items-center gap-2 pl-6 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.leadCaptureRequired ?? false}
                    onChange={(e) => updateDraft({ leadCaptureRequired: e.target.checked })}
                  />
                  Require before chat
                </label>
              ) : null}
              <p className="text-muted-foreground text-xs">
                {draft.leadCaptureRequired
                  ? "Visitors must submit their name before they can send messages."
                  : draft.leadCaptureEnabled
                    ? "Visitors see an optional prompt at the top of chat and can skip it."
                    : "Lead capture is off. Visitors can chat without sharing contact info."}
              </p>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.proactiveEnabled ?? false}
                  onChange={(e) => updateDraft({ proactiveEnabled: e.target.checked })}
                />
                Proactive message
              </label>
              {draft.proactiveEnabled ? (
                <>
                  <div className="space-y-1">
                    <Label>Proactive delay (ms)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={draft.proactiveDelayMs ?? 5000}
                      onChange={(e) =>
                        updateDraft({ proactiveDelayMs: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Proactive message</Label>
                    <Textarea
                      rows={2}
                      value={draft.proactiveMessage ?? ""}
                      onChange={(e) => updateDraft({ proactiveMessage: e.target.value })}
                      placeholder="Hi! How can we help?"
                    />
                  </div>
                </>
              ) : null}
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.aiEnabled !== false}
                  onChange={(e) => updateDraft({ aiEnabled: e.target.checked })}
                />
                AI assistant enabled
              </label>
              <p className="text-muted-foreground text-xs">
                When enabled, visitors can use /ai and FAQ shortcuts trigger AI answers.
              </p>
              {draft.aiEnabled !== false ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.aiAutoReply !== false}
                    onChange={(e) => updateDraft({ aiAutoReply: e.target.checked })}
                  />
                  Auto-reply to visitor messages
                </label>
              ) : null}
              {draft.aiEnabled !== false ? (
                <p className="text-muted-foreground text-xs">
                  {draft.aiAutoReply !== false
                    ? "The AI assistant automatically responds to new visitor messages."
                    : "Visitors must use /ai or FAQ shortcuts to get AI answers."}
                </p>
              ) : null}
            </div>

            <Button onClick={() => void updateSettings({ settings: draft })}>Save settings</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-muted-foreground px-4 pb-2 text-xs">
            Saved settings apply to your live embed on the next page load.
          </p>
          <div
            className="mx-4 mb-4 h-[480px] overflow-hidden border"
            style={{ borderRadius: draft.borderRadius ?? 0 }}
          >
            <div
              className="px-4 py-3 text-sm font-medium text-white"
              style={{ backgroundColor: draft.primaryColor }}
            >
              {draft.title}
            </div>
            {draft.proactiveEnabled ? (
              <div className="flex items-start justify-between gap-2 border-b bg-muted/40 px-3 py-2 text-xs">
                <p>{proactivePreviewMessage}</p>
                <span className="text-muted-foreground shrink-0">×</span>
              </div>
            ) : null}
            {draft.leadCaptureEnabled && !draft.leadCaptureRequired ? (
              <div className="border-b px-3 py-2 text-xs">
                <p className="font-medium">Share your details (optional)</p>
                <p className="text-muted-foreground">Name and email banner with skip</p>
              </div>
            ) : null}
            {draft.leadCaptureEnabled && draft.leadCaptureRequired ? (
              <div className="text-muted-foreground flex h-full items-center justify-center px-4 text-center text-xs">
                Lead gate — visitors must enter name before chat
              </div>
            ) : (
              <div className="space-y-2 p-4">
                <div
                  className="ml-auto max-w-[85%] rounded-lg px-3 py-2 text-sm text-white"
                  style={{ backgroundColor: draft.primaryColor }}
                >
                  Hello!
                </div>
                <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm">Hi there!</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
