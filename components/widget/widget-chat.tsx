"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const SESSION_KEY = "zencom_visitor_session";
const LEAD_KEY = "zencom_lead_captured";

function getSessionToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, token);
  }
  return token;
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
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const settings = useQuery(api.visitors.getWidgetSettings, { embedKey });
  const getOrCreateVisitor = useMutation(api.visitors.getOrCreate);
  const getOrCreateConversation = useMutation(api.conversations.getOrCreateForVisitor);
  const sendFromVisitor = useMutation(api.messages.sendFromVisitor);
  const captureLead = useMutation(api.leads.captureFromWidget);
  const setVisitorTyping = useMutation(api.presence.setVisitorTyping);
  const askFromWidget = useAction(api.widgetAi.askFromWidget);

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
      const conversation = await getOrCreateConversation({
        embedKey,
        visitorId: visitor.visitorId,
      });
      setConversationId(conversation.conversationId);
      setBootstrapped(true);
    }
    void bootstrap();
  }, [embedKey, getOrCreateVisitor, getOrCreateConversation]);

  const title = settings?.title ?? "Chat";
  const needsLeadGate =
    settings?.leadCaptureEnabled && settings?.leadCaptureRequired && !leadDone;

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

  async function handleSend() {
    if (!conversationId || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    await setVisitorTyping({ embedKey, conversationId, isTyping: false });

    if (text.startsWith("/ai ")) {
      const query = text.slice(4).trim();
      if (!query) return;
      setAiLoading(true);
      try {
        await askFromWidget({ embedKey, conversationId, query });
      } finally {
        setAiLoading(false);
      }
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
      <div className="flex h-full flex-col bg-background p-4">
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
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header
        className="px-4 py-3 text-sm font-medium text-white"
        style={{ backgroundColor: settings?.primaryColor ?? "#2563eb" }}
      >
        {title}
      </header>
      {(settings?.faqShortcuts?.length ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-1 border-b p-2">
          {(settings?.faqShortcuts ?? []).map((shortcut: string) => (
            <button
              key={shortcut}
              type="button"
              className="rounded-full border px-2 py-0.5 text-xs"
              onClick={() => {
                if (!conversationId) return;
                void sendFromVisitor({ embedKey, conversationId, body: shortcut });
              }}
            >
              {shortcut}
            </button>
          ))}
        </div>
      ) : null}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {sortedMessages.map((message: Doc<"messages">) => (
            <div
              key={message._id}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                message.authorType === "visitor"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : message.authorType === "ai"
                    ? "border bg-background"
                    : "bg-muted",
              )}
            >
              {message.body}
              {message.citations && message.citations.length > 0 ? (
                <div className="text-muted-foreground mt-2 space-y-1 border-t pt-2 text-xs">
                  {message.citations.map((c: NonNullable<Doc<"messages">["citations"]>[number]) => (
                    <p key={c.documentId}>
                      Source: {c.title}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {typing?.agentTyping ? (
            <p className="text-muted-foreground text-xs">Agent is typing...</p>
          ) : null}
          {aiLoading ? (
            <p className="text-muted-foreground text-xs">AI is thinking...</p>
          ) : null}
        </div>
      </ScrollArea>
      <div className="flex gap-2 border-t p-3">
        <Input
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          placeholder="Type a message... (/ai for AI)"
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSend();
          }}
        />
        <Button onClick={() => void handleSend()} disabled={!draft.trim() || aiLoading}>
          Send
        </Button>
      </div>
    </div>
  );
}
