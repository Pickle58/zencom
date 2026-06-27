# Phase 7 — Widget AI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Streaming RAG answers in the widget with citations and human takeover when agents join.

**Architecture:** Visitor messages trigger scheduled `autoReplyFromVisitor` when AI enabled and not paused. OpenAI streaming writes incremental chunks to a placeholder `messages` row; Convex subscriptions deliver live updates. Agent replies set `aiPaused: true` (human takeover). Uses existing vector search (`searchKb`) + OpenAI (not full `@convex-dev/agent` threads — hybrid from Phase 3).

**Spec:** [`docs/superpowers/specs/2026-06-26-zencom-phased-design.md`](../specs/2026-06-26-zencom-phased-design.md)

**Depends on:** Phase 2 (widget/inbox) + Phase 3 (KB/RAG)

---

## Current State (pre-plan audit)

| Area | Status |
|------|--------|
| `widgetAi.askFromWidget` | Non-streaming; wrong `orgId` passed |
| `/ai` command in widget | Works but blocks until action completes |
| Citations on messages | Basic "Source: title" |
| `aiPaused` + pause/resume | Inbox only |
| Auto-reply on visitor msg | Missing |
| Streaming | Missing |
| `aiEnabled` setting | Missing |

---

## File Map

| File | Responsibility |
|------|----------------|
| `convex/schema.ts` | `streamStatus` on messages; `aiEnabled` on widgetSettings |
| `convex/aiInternals.ts` | Streaming message mutations |
| `convex/aiActions.ts` | `streamGenerateAnswer`, `autoReplyFromVisitor` |
| `convex/widgetAi.ts` | Public widget actions |
| `convex/messages.ts` | Schedule auto-reply after visitor send |
| `convex/conversations.ts` | `getForWidget` query |
| `components/widget/widget-chat.tsx` | Streaming UI, citations, takeover banner |
| `app/(dashboard)/dashboard/customize/page.tsx` | AI toggles |
| `components/inbox/inbox-view.tsx` | Take over button |
| `docs/superpowers/verification/phase-7-checklist.md` | Verification |

---

### Task 1: Verify AI infrastructure

- [ ] Confirm `aiActions`, `aiControl`, citations schema, usage quotas
- [ ] Confirm inbox pause/resume works

---

### Task 2: Schema + widget AI settings

**Files:** `convex/schema.ts`, `convex/lib/embedKey.ts`

- [ ] `messages.streamStatus`: optional `"streaming" | "complete" | "failed"`
- [ ] `widgetSettings.aiEnabled`: optional boolean (default true)
- [ ] `widgetSettings.aiAutoReply`: optional boolean (default true)

---

### Task 3: Streaming backend

**Files:** `convex/aiInternals.ts`, `convex/aiActions.ts`, `convex/widgetAi.ts`

- [ ] `createStreamingAiMessage`, `appendAiMessageBody`, `finalizeAiMessage`, `failAiMessage` internal mutations
- [ ] `streamGenerateAnswer` internalAction — KB search → OpenAI stream → patch message
- [ ] `autoReplyFromVisitor` internalAction — checks settings, aiPaused, triggers stream
- [ ] Fix `askFromWidget` to use streaming path (remove bogus orgId)
- [ ] Fallback non-stream when no API key (single patch)

---

### Task 4: Auto-reply trigger + conversation query

**Files:** `convex/messages.ts`, `convex/conversations.ts`

- [ ] After `sendFromVisitor`, schedule `autoReplyFromVisitor` when `aiAutoReply` enabled
- [ ] Skip auto-reply for empty body or `/ai` prefix (handled separately)
- [ ] `getForWidget` widgetQuery — returns `{ aiPaused, hasAgentReply }`

---

### Task 5: Widget UI

**Files:** `components/widget/widget-chat.tsx`

- [ ] Remove blocking `aiLoading`; rely on reactive streaming message
- [ ] Keep `/ai query` as explicit AI trigger
- [ ] Human takeover banner when `aiPaused` or agent message in thread
- [ ] Streaming cursor on messages with `streamStatus === "streaming"`
- [ ] Citations: numbered list with title + excerpt excerpt
- [ ] FAQ shortcuts trigger AI when `aiEnabled` (send as AI query)

---

### Task 6: Customizer + inbox takeover

**Files:** `customize/page.tsx`, `inbox-view.tsx`

- [ ] AI enabled + auto-reply toggles in customizer
- [ ] Inbox "Take over" button: assignToMe + pauseAi

---

### Task 7: Verification + build

**Files:** `docs/superpowers/verification/phase-7-checklist.md`

- [ ] `pnpm lint`, `npx convex codegen`, `pnpm build`

---

## Phase 7 Exit Criteria

- [ ] Widget streams AI answers with live text updates
- [ ] Citations displayed on AI messages
- [ ] Auto-reply on visitor messages when enabled
- [ ] Human takeover pauses AI; widget shows agent mode
- [ ] `/ai` command still works
- [ ] Lint + build pass

---

## Out of Scope

- Full `@convex-dev/agent` thread history
- Widget-side markdown rendering for AI
- AI streaming in dashboard inbox test (already non-streaming)
