"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Filter = "all" | "unread" | "unassigned" | "assigned_to_me" | "closed";

type EnrichedConversation = FunctionReturnType<
  typeof api.conversations.list
>[number];

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Open" },
  { id: "unread", label: "Unread" },
  { id: "unassigned", label: "Unassigned" },
  { id: "assigned_to_me", label: "Assigned to me" },
  { id: "closed", label: "Closed" },
];

function truncate(text: string, maxLength = 80): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

function formatAssignee(clerkUserId: string): string {
  if (clerkUserId.length <= 12) return clerkUserId;
  return `${clerkUserId.slice(0, 6)}…${clerkUserId.slice(-4)}`;
}

function visitorLabel(conversation: EnrichedConversation): string {
  return conversation.visitorName ?? `Visitor ${conversation.visitorId.slice(-6)}`;
}

export function InboxView() {
  const { userId } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<Id<"conversations"> | null>(null);
  const [draft, setDraft] = useState("");

  const conversations = useQuery(api.conversations.list, { filter });

  const activeId = useMemo(() => {
    if (!conversations?.length) return null;
    if (selectedId && conversations.some((c: EnrichedConversation) => c._id === selectedId)) {
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
  const takeOver = useMutation(api.conversations.takeOver);
  const unassign = useMutation(api.conversations.unassign);
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

  const anotherAgentTyping =
    typing?.agentTyping === true &&
    typing.agentTypingClerkUserId !== null &&
    typing.agentTypingClerkUserId !== userId;

  useEffect(() => {
    if (!activeId) return;
    void heartbeat({ conversationId: activeId });
    const interval = setInterval(() => {
      void heartbeat({ conversationId: activeId });
    }, 15_000);
    return () => clearInterval(interval);
  }, [activeId, heartbeat]);

  const selected = useMemo(
    () => conversations?.find((c: EnrichedConversation) => c._id === activeId) ?? null,
    [conversations, activeId],
  );

  const hasAgentReply = useMemo(
    () => (messages ?? []).some((message: Doc<"messages">) => message.authorType === "agent"),
    [messages],
  );

  const aiHandling = selected && !selected.aiPaused && !hasAgentReply;

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

  async function handleTakeOver(conversationId: Id<"conversations">) {
    await takeOver({ conversationId });
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-0 overflow-hidden rounded-xl border">
      <div className="flex min-h-0 w-80 flex-col border-r">
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
        <ScrollArea className="min-h-0 flex-1">
          <div className="divide-y">
            {(conversations ?? []).map((conversation: EnrichedConversation) => (
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
                    {visitorLabel(conversation)}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    {conversation.assignedToClerkUserId ? (
                      <Badge variant="secondary">Assigned</Badge>
                    ) : null}
                    {conversation.unreadByAgent ? (
                      <Badge variant="default">New</Badge>
                    ) : null}
                  </div>
                </div>
                {conversation.lastMessageBody ? (
                  <p className="text-muted-foreground truncate text-xs">
                    {truncate(conversation.lastMessageBody)}
                  </p>
                ) : null}
                <p className="text-muted-foreground truncate text-xs">
                  {conversation.status}
                  {conversation.assignedToClerkUserId
                    ? ` · ${formatAssignee(conversation.assignedToClerkUserId)}`
                    : ""}
                  {" · "}
                  {new Date(conversation.lastMessageAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {selected ? (
          <>
            <div className="flex shrink-0 items-center gap-2 border-b p-3">
              <span className="text-sm font-medium">{visitorLabel(selected)}</span>
              <Badge variant="outline">{selected.status}</Badge>
              {selected.assignedToClerkUserId ? (
                <Badge variant="secondary">
                  Assigned · {formatAssignee(selected.assignedToClerkUserId)}
                </Badge>
              ) : null}
              {selected.aiPaused ? (
                <Badge variant="secondary">AI paused</Badge>
              ) : null}
              {aiHandling ? (
                <Badge variant="outline">AI handling</Badge>
              ) : null}
              {(viewers?.length ?? 0) > 0 ? (
                <span className="text-muted-foreground text-xs">
                  {viewers?.length} viewing
                </span>
              ) : null}
              <div className="ml-auto flex gap-2">
                {!selected.aiPaused ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleTakeOver(selected._id)}
                  >
                    Take over
                  </Button>
                ) : null}
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
                {selected.assignedToClerkUserId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void unassign({ conversationId: selected._id })}
                  >
                    Unassign
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => assignToMe({ conversationId: selected._id })}
                  >
                    Assign to me
                  </Button>
                )}
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
            <ScrollArea className="min-h-0 flex-1 p-4">
              <div className="space-y-3">
                {typing?.visitorTyping ? (
                  <p className="text-muted-foreground text-xs">Visitor is typing...</p>
                ) : null}
                {anotherAgentTyping ? (
                  <p className="text-muted-foreground text-xs">Another agent is typing...</p>
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
            <div className="flex shrink-0 gap-2 border-t p-3">
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
