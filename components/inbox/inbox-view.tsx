"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Filter = "all" | "unread" | "unassigned" | "assigned_to_me";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "unassigned", label: "Unassigned" },
  { id: "assigned_to_me", label: "Assigned to me" },
];

export function InboxView() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<Id<"conversations"> | null>(null);
  const [draft, setDraft] = useState("");

  const conversations = useQuery(api.conversations.list, { filter });

  const activeId = useMemo(() => {
    if (!conversations?.length) return null;
    if (selectedId && conversations.some((c: Doc<"conversations">) => c._id === selectedId)) {
      return selectedId;
    }
    return conversations[0]._id;
  }, [conversations, selectedId]);

  const messages = useQuery(
    api.messages.listForAgent,
    activeId ? { conversationId: activeId } : "skip",
  );

  const sendFromAgent = useMutation(api.messages.sendFromAgent);
  const markRead = useMutation(api.messages.markRead);
  const assignToMe = useMutation(api.conversations.assignToMe);
  const setStatus = useMutation(api.conversations.setStatus);
  const heartbeat = useMutation(api.presence.heartbeat);
  const setAgentTyping = useMutation(api.presence.setAgentTyping);
  const viewers = useQuery(
    api.presence.listViewers,
    activeId ? { conversationId: activeId } : "skip",
  );
  const typing = useQuery(
    api.presence.getTypingState,
    activeId ? { conversationId: activeId } : "skip",
  );
  const pauseAi = useMutation(api.aiControl.pauseAi);
  const resumeAi = useMutation(api.aiControl.resumeAi);

  useEffect(() => {
    if (!activeId) return;
    void heartbeat({ conversationId: activeId });
    const interval = setInterval(() => {
      void heartbeat({ conversationId: activeId });
    }, 15_000);
    return () => clearInterval(interval);
  }, [activeId, heartbeat]);

  const selected = useMemo(
    () => conversations?.find((c: Doc<"conversations">) => c._id === activeId) ?? null,
    [conversations, activeId],
  );

  useEffect(() => {
    if (activeId) {
      void markRead({ conversationId: activeId });
    }
  }, [activeId, markRead]);

  async function handleSend() {
    if (!activeId || !draft.trim()) return;
    await setAgentTyping({ conversationId: activeId, isTyping: false });
    await sendFromAgent({ conversationId: activeId, body: draft });
    setDraft("");
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border">
      <div className="flex w-80 flex-col border-r">
        <div className="flex flex-wrap gap-1 border-b p-2">
          {filters.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={filter === f.id ? "default" : "ghost"}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {(conversations ?? []).map((conversation: Doc<"conversations">) => (
              <button
                key={conversation._id}
                type="button"
                onClick={() => setSelectedId(conversation._id)}
                className={cn(
                  "w-full px-3 py-3 text-left hover:bg-muted/50",
                  activeId === conversation._id && "bg-muted",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    Visitor {conversation.visitorId.slice(-6)}
                  </span>
                  {conversation.unreadByAgent ? (
                    <Badge variant="default">New</Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  {conversation.status} · {new Date(conversation.lastMessageAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <>
            <div className="flex items-center gap-2 border-b p-3">
              <span className="text-sm font-medium">Conversation</span>
              <Badge variant="outline">{selected.status}</Badge>
              {selected.aiPaused ? (
                <Badge variant="secondary">AI paused</Badge>
              ) : null}
              {(viewers?.length ?? 0) > 0 ? (
                <span className="text-muted-foreground text-xs">
                  {viewers?.length} viewing
                </span>
              ) : null}
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void (selected.aiPaused
                      ? resumeAi({ conversationId: selected._id })
                      : pauseAi({ conversationId: selected._id }))
                  }
                >
                  {selected.aiPaused ? "Resume AI" : "Pause AI"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => assignToMe({ conversationId: selected._id })}>
                  Assign to me
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setStatus({
                      conversationId: selected._id,
                      status: selected.status === "open" ? "closed" : "open",
                    })
                  }
                >
                  {selected.status === "open" ? "Close" : "Reopen"}
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {typing?.visitorTyping ? (
                  <p className="text-muted-foreground text-xs">Visitor is typing...</p>
                ) : null}
                {(messages ?? []).map((message: Doc<"messages">) => (
                  <div
                    key={message._id}
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      message.authorType === "agent"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    {message.body}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2 border-t p-3">
              <Textarea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (activeId) {
                    void setAgentTyping({
                      conversationId: activeId,
                      isTyping: e.target.value.length > 0,
                    });
                  }
                }}
                placeholder="Write a reply..."
                rows={2}
                className="min-h-[60px]"
              />
              <Button onClick={() => void handleSend()} disabled={!draft.trim()}>
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
