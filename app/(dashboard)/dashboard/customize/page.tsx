"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.leadCaptureEnabled ?? false}
                onChange={(e) => updateDraft({ leadCaptureEnabled: e.target.checked })}
              />
              Enable lead capture gate
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.proactiveEnabled ?? false}
                onChange={(e) => updateDraft({ proactiveEnabled: e.target.checked })}
              />
              Proactive message
            </label>
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
            className="mx-4 mb-4 h-[480px] overflow-hidden rounded-lg border"
            style={{ borderRadius: draft.borderRadius }}
          >
            <div
              className="px-4 py-3 text-sm font-medium text-white"
              style={{ backgroundColor: draft.primaryColor }}
            >
              {draft.title}
            </div>
            <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
              Widget preview
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
