"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { BRAND_WIDGET_COLOR } from "@/lib/brand";

const SESSION_KEY = "zencom_visitor_session";
const LEAD_KEY = "zencom_lead_captured";
const PROACTIVE_DISMISSED_KEY = "zencom_proactive_dismissed";

function getSessionToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

function getProactiveDismissed(embedKey: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${PROACTIVE_DISMISSED_KEY}:${embedKey}`) === "1";
}

function truncateExcerpt(text: string, maxLength = 80): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

function StreamingCursor() {
  return (
    <span
      className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-text-bottom"
      aria-hidden
    />
  );
}

export function WidgetChat({ embedKey }: { embedKey: string }) {
  const [visitorId, setVisitorId] = useState<Doc<"visitors">["_id"] | null>(null);
  const [conversationId, setConversationId] = useState<Doc<"conversations">["_id"] | null>(null);
  const [draft, setDraft] = useState("");
  const [bootstrapped, setBootstrapped] = useState(false);
  const [leadDone, setLeadDone] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`${LEAD_KEY}:${embedKey}`) === "1";
  });
  const [leadSkipped, setLeadSkipped] = useState(false);
  const [dismissedProactive, setDismissedProactive] = useState(() =>
    getProactiveDismissed(embedKey),
  );
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");

  const settings = useQuery(api.visitors.getWidgetSettings, { embedKey });
  const getOrCreateVisitor = useMutation(api.visitors.getOrCreate);
  const getOrCreateConversation = useMutation(api.conversations.getOrCreateForVisitor);
  const sendFromVisitor = useMutation(api.messages.sendFromVisitor);
  const captureLead = useMutation(api.leads.captureFromWidget);
  const setVisitorTyping = useMutation(api.presence.setVisitorTyping);
  const askFromWidget = useAction(api.widgetAi.askFromWidget);

  const conversation = useQuery(
    api.conversations.getForWidget,
    conversationId ? { embedKey, conversationId } : "skip",
  );

  const messages = useQuery(
    api.messages.listForWidget,
    conversationId ? { embedKey, conversationId } : "skip",
  );
  const typing = useQuery(
    api.presence.getTypingStateForWidget,
    conversationId ? { embedKey, conversationId } : "skip",
  );

  useEffect(() => {
    async function bootstrap() {
      const sessionToken = getSessionToken();
      const visitor = await getOrCreateVisitor({ embedKey, sessionToken });
      setVisitorId(visitor.visitorId);
      const conv = await getOrCreateConversation({
        embedKey,
        visitorId: visitor.visitorId,
      });
      setConversationId(conv.conversationId);
      setBootstrapped(true);
    }
    void bootstrap();
  }, [embedKey, getOrCreateVisitor, getOrCreateConversation]);

  const title = settings?.title ?? "Chat";
  const primaryColor = settings?.primaryColor ?? BRAND_WIDGET_COLOR;
  const borderRadius = settings?.borderRadius ?? 0;
  const proactiveMessage = settings?.proactiveMessage?.trim();
  const aiEnabled = settings?.aiEnabled !== false;
  const aiAutoReply = settings?.aiAutoReply !== false;

  const humanTakeover = conversation?.aiPaused || conversation?.hasAgentReply;

  const needsLeadGate =
    settings?.leadCaptureEnabled && settings?.leadCaptureRequired && !leadDone;
  const optionalLeadPrompt =
    settings?.leadCaptureEnabled &&
    !settings?.leadCaptureRequired &&
    !leadDone &&
    !leadSkipped;
  const showProactiveBanner =
    settings?.proactiveEnabled &&
    Boolean(proactiveMessage) &&
    !dismissedProactive;

  const inputPlaceholder = humanTakeover
    ? "Type a message..."
    : aiEnabled && aiAutoReply
      ? "Type a message... (AI may auto-reply; /ai for explicit AI)"
      : aiEnabled
        ? "Type a message... (/ai for AI)"
        : "Type a message...";

  async function handleLeadSubmit() {
    if (!visitorId || !leadName.trim()) return;
    await captureLead({
      embedKey,
      visitorId,
      conversationId: conversationId ?? undefined,
      name: leadName,
      email: leadEmail || undefined,
    });
    localStorage.setItem(`${LEAD_KEY}:${embedKey}`, "1");
    setLeadDone(true);
  }

  function handleDismissProactive() {
    localStorage.setItem(`${PROACTIVE_DISMISSED_KEY}:${embedKey}`, "1");
    setDismissedProactive(true);
  }

  function handleFaqShortcut(shortcut: string) {
    if (!conversationId) return;
    if (aiEnabled) {
      void askFromWidget({ embedKey, conversationId, query: shortcut });
    } else {
      void sendFromVisitor({ embedKey, conversationId, body: shortcut });
    }
  }

  async function handleSend() {
    if (!conversationId || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    await setVisitorTyping({ embedKey, conversationId, isTyping: false });

    if (text.startsWith("/ai ")) {
      const query = text.slice(4).trim();
      if (!query) return;
      void askFromWidget({ embedKey, conversationId, query });
      return;
    }

    await sendFromVisitor({ embedKey, conversationId, body: text });
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    if (conversationId) {
      void setVisitorTyping({ embedKey, conversationId, isTyping: value.length > 0 });
    }
  }

  const sortedMessages = useMemo(() => messages ?? [], [messages]);

  if (!bootstrapped) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading chat...
      </div>
    );
  }

  if (needsLeadGate) {
    return (
      <div
        className="flex h-full min-h-0 flex-col overflow-hidden bg-background"
        style={{ borderRadius }}
      >
        <div className="flex h-full flex-col p-4">
          <h2 className="text-sm font-medium">Before we chat</h2>
          <p className="text-muted-foreground mb-4 text-xs">Tell us how to reach you.</p>
          <Input
            className="mb-2"
            placeholder="Name"
            value={leadName}
            onChange={(e) => setLeadName(e.target.value)}
          />
          <Input
            className="mb-4"
            placeholder="Email (optional)"
            value={leadEmail}
            onChange={(e) => setLeadEmail(e.target.value)}
          />
          <Button onClick={() => void handleLeadSubmit()} disabled={!leadName.trim()}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-background"
      style={{ borderRadius }}
    >
      <header
        className="px-4 py-3 text-sm font-medium text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {title}
      </header>
      {humanTakeover ? (
        <div className="border-b bg-muted/60 px-3 py-2 text-center text-xs">
          You&apos;re chatting with our team
        </div>
      ) : null}
      {showProactiveBanner ? (
        <div className="flex items-start justify-between gap-2 border-b bg-muted/40 px-3 py-2">
          <p className="text-xs">{proactiveMessage}</p>
          <button
            type="button"
            className="text-muted-foreground shrink-0 text-sm leading-none"
            aria-label="Dismiss proactive message"
            onClick={handleDismissProactive}
          >
            ×
          </button>
        </div>
      ) : null}
      {optionalLeadPrompt ? (
        <div className="space-y-2 border-b px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium">Share your details (optional)</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-0 text-xs"
              onClick={() => setLeadSkipped(true)}
            >
              Skip
            </Button>
          </div>
          <Input
            placeholder="Name"
            value={leadName}
            onChange={(e) => setLeadName(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="flex gap-2">
            <Input
              placeholder="Email (optional)"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              className="h-8 flex-1 text-xs"
            />
            <Button
              type="button"
              size="sm"
              className="h-8"
              disabled={!leadName.trim()}
              onClick={() => void handleLeadSubmit()}
            >
              Save
            </Button>
          </div>
        </div>
      ) : null}
      {(settings?.faqShortcuts?.length ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-1 border-b p-2">
          {(settings?.faqShortcuts ?? []).map((shortcut: string) => (
            <button
              key={shortcut}
              type="button"
              className="rounded-full border px-2 py-0.5 text-xs"
              onClick={() => handleFaqShortcut(shortcut)}
            >
              {shortcut}
            </button>
          ))}
        </div>
      ) : null}
      <ScrollArea className="min-h-0 flex-1 p-4">
        <div className="space-y-2">
          {sortedMessages.map((message: Doc<"messages">) => (
            <div
              key={message._id}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                message.authorType === "visitor"
                  ? "ml-auto text-white"
                  : message.authorType === "ai"
                    ? "border bg-background"
                    : "bg-muted",
              )}
              style={
                message.authorType === "visitor"
                  ? { backgroundColor: primaryColor }
                  : undefined
              }
            >
              <span className="whitespace-pre-wrap">
                {message.body}
                {message.authorType === "ai" && message.streamStatus === "streaming" ? (
                  <StreamingCursor />
                ) : null}
              </span>
              {message.citations && message.citations.length > 0 ? (
                <ol className="text-muted-foreground mt-2 list-decimal space-y-1 border-t pt-2 pl-4 text-xs">
                  {message.citations.map(
                    (c: NonNullable<Doc<"messages">["citations"]>[number], index: number) => (
                      <li key={c.documentId}>
                        [{index + 1}] {c.title} — {truncateExcerpt(c.excerpt)}
                      </li>
                    ),
                  )}
                </ol>
              ) : null}
            </div>
          ))}
          {typing?.agentTyping && humanTakeover ? (
            <p className="text-muted-foreground text-xs">Agent is typing...</p>
          ) : null}
        </div>
      </ScrollArea>
      <div className="flex gap-2 border-t p-3">
        <Input
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          placeholder={inputPlaceholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSend();
          }}
        />
        <Button onClick={() => void handleSend()} disabled={!draft.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
