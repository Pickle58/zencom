# Phase 2 — Inbox + Widget Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed widget on an external site; visitor sends messages; agent replies in real-time inbox with filters, assignment, presence, and typing.

**Architecture:** Widget APIs use `widgetQuery`/`widgetMutation` (embed-key auth). Dashboard inbox uses `orgQuery`/`orgMutation`. Real-time via Convex subscriptions — no polling.

**Tech Stack:** Next.js 16, Convex, Clerk orgs, Shadcn, `public/embed.js` loader + `/widget/[embedKey]` iframe

**Spec:** [`docs/superpowers/specs/2026-06-26-zencom-phased-design.md`](../specs/2026-06-26-zencom-phased-design.md)

**Depends on:** Phase 0 + 1 complete (Clerk orgs, workspace provisioning, dashboard shell)

---

## Current State (pre-plan audit)

Most Phase 2 code **already exists**. This plan **verifies, hardens, and fills gaps** — not a greenfield build.

| Area | Status |
|------|--------|
| Schema (`visitors`, `conversations`, `messages`, `conversationPresence`) | Present |
| `widgetQuery` / `widgetMutation` | Present |
| Widget iframe + `widget-chat.tsx` | Present |
| `public/embed.js` | MVP — hardcoded styling |
| Inbox two-pane + 4 filters | Present |
| Assignment | Partial — "Assign to me" only |
| Presence + typing | Present — agent typing not shown in inbox |
| Install page | Placeholder — no live snippet |

---

## File Map (Phase 2)

| File | Responsibility |
|------|----------------|
| `convex/schema.ts` | Messaging tables + indexes |
| `convex/lib/customFunctions.ts` | `widgetQuery`, `widgetMutation` |
| `convex/visitors.ts` | Visitor session + agent lookup |
| `convex/conversations.ts` | List, filters, assign, status |
| `convex/messages.ts` | Send/list for agent + widget |
| `convex/presence.ts` | Heartbeat, typing, viewers |
| `components/widget/widget-chat.tsx` | Widget chat UI |
| `app/widget/[embedKey]/page.tsx` | Public iframe route |
| `public/embed.js` | Site embed loader |
| `components/inbox/inbox-view.tsx` | Two-pane inbox |
| `app/(dashboard)/dashboard/inbox/page.tsx` | Inbox route |
| `app/(dashboard)/dashboard/install/page.tsx` | Install snippet |
| `proxy.ts` | Public `/widget`, `/embed.js` |
| `docs/superpowers/verification/phase-2-checklist.md` | Verification checklist |

---

## Prerequisites (human)

Before Task 1, confirm Phase 1 gate:

- [ ] Clerk orgs enabled; signed in with active org
- [ ] Workspace row exists in Convex for your org
- [ ] Embed key visible on `/dashboard/settings` (after first provision)
- [ ] `pnpm dev:all` runs (Convex + Next.js)

---

### Task 1: Verify messaging schema and indexes

**Files:**
- Verify: `convex/schema.ts`

- [ ] **Step 1: Confirm Phase 2 tables**

Required tables with `workspaceId` scoping:
- `visitors` — index `by_workspace_session`
- `conversations` — indexes for status, lastMessage, assigned
- `messages` — index `by_conversation`
- `conversationPresence` — indexes `by_conversation`, `by_conversation_user`

- [ ] **Step 2: Add compound index for visitor open conversation lookup**

Add to `conversations`:

```typescript
.index("by_workspace_visitor_status", ["workspaceId", "visitorId", "status"])
```

Run `npx convex codegen` after schema change.

- [ ] **Step 3: Verify**

Run: `npx convex codegen`  
Expected: no errors; `_generated/` updates

---

### Task 2: Harden conversation APIs

**Files:**
- Modify: `convex/conversations.ts`
- Modify: `convex/schema.ts` (if Task 1 not done)

- [ ] **Step 1: Optimize `getOrCreateForVisitor`**

Use `by_workspace_visitor_status` index instead of collecting all open conversations.

- [ ] **Step 2: Filter "all" to open conversations only**

Default list should show `status === "open"`. Closed conversations appear only when filter is extended (add `closed` filter in Task 7).

- [ ] **Step 3: Add `unassign` mutation**

```typescript
export const unassign = orgMutation({
  args: { conversationId: v.id("conversations") },
  returns: v.null(),
  // Clear assignedToClerkUserId after workspace ownership check
});
```

- [ ] **Step 4: Enrich list with preview data**

Extend `list` return type (or add `listEnriched`) to include:
- `visitorName` (optional string from visitor record)
- `lastMessageBody` (optional string — latest message body)

Keep validators on args and returns.

- [ ] **Step 5: Verify**

Run: `npx convex codegen && pnpm lint`

---

### Task 3: Visitor lookup for agents

**Files:**
- Modify: `convex/visitors.ts`

- [ ] **Step 1: Add `getForAgent` orgQuery**

```typescript
export const getForAgent = orgQuery({
  args: { visitorId: v.id("visitors") },
  returns: v.union(visitorValidator, v.null()),
  // Verify visitor.workspaceId === ctx.workspace._id
});
```

- [ ] **Step 2: Verify**

Run: `pnpm lint`

---

### Task 4: Verify messages real-time path

**Files:**
- Verify: `convex/messages.ts`
- Verify: `components/widget/widget-chat.tsx`

- [ ] **Step 1: Confirm exports**

Required:
- `listForAgent` (orgQuery)
- `listForWidget` (widgetQuery)
- `sendFromVisitor` (widgetMutation)
- `sendFromAgent` (orgMutation)
- `markRead` (orgMutation)

All must have `args` and `returns` validators.

- [ ] **Step 2: Confirm widget sends on Enter/submit**

Widget must call `sendFromVisitor` and clear input; messages appear via `useQuery(listForWidget)`.

- [ ] **Step 3: Fix any missing validators or auth checks**

Run: `pnpm lint`

---

### Task 5: Presence and typing polish

**Files:**
- Verify: `convex/presence.ts`
- Modify: `components/inbox/inbox-view.tsx`

- [ ] **Step 1: Verify presence exports**

`heartbeat`, `listViewers`, `setAgentTyping`, `setVisitorTyping`, `getTypingState`, `getTypingStateForWidget`

- [ ] **Step 2: Show agent typing in inbox**

When `typing.agentTyping` is true (and not current user), show "Agent is typing..." below visitor typing indicator.

- [ ] **Step 3: Verify heartbeat interval**

Inbox should heartbeat every 15s on active conversation.

Run: `pnpm lint`

---

### Task 6: embed.js workspace theming

**Files:**
- Modify: `public/embed.js`
- Modify: `app/(dashboard)/dashboard/settings/page.tsx`
- Modify: `app/(dashboard)/dashboard/install/page.tsx`

- [ ] **Step 1: Read optional data attributes on embed script**

Support on `<script>` tag:
- `data-title` — launcher label (default "Chat")
- `data-color` — launcher background (default `#2563eb`)
- `data-position` — `bottom-right` | `bottom-left`

- [ ] **Step 2: Update settings + install snippets**

Include workspace `widgetSettings.title`, `primaryColor`, `position` in generated snippet.

- [ ] **Step 3: Manual check**

Open a static HTML file with the snippet; launcher uses workspace color and title.

---

### Task 7: Inbox UI enhancements

**Files:**
- Modify: `components/inbox/inbox-view.tsx`
- Modify: `convex/conversations.ts` (if filter not added in Task 2)

- [ ] **Step 1: Add "Closed" filter**

Extend filter union: `all | unread | unassigned | assigned_to_me | closed`

- [ ] **Step 2: Display visitor identity**

Use enriched list data or `visitors.getForAgent` — show name or email when available, else "Visitor {shortId}".

- [ ] **Step 3: Show assignee + unassign**

Display assigned agent ID (truncated) or "Unassigned". Add "Unassign" button when assigned.

- [ ] **Step 4: Show last message preview in list**

Use `lastMessageBody` from enriched list.

- [ ] **Step 5: Verify layout**

Two-pane inbox remains responsive; filters wrap on narrow screens.

Run: `pnpm lint`

---

### Task 8: Install page with live embed snippet

**Files:**
- Modify: `app/(dashboard)/dashboard/install/page.tsx`

- [ ] **Step 1: Convert to client component**

Mirror settings page pattern: `ensureCurrent`, `getCurrent`, show embed key + themed snippet.

- [ ] **Step 2: Copy-to-clipboard button**

Add button to copy snippet (use `navigator.clipboard.writeText`).

- [ ] **Step 3: Link to inbox**

"After installing, open Inbox to reply" with link to `/dashboard/inbox`.

Run: `pnpm lint`

---

### Task 9: Verify public routes and widget iframe

**Files:**
- Verify: `proxy.ts`
- Verify: `app/widget/[embedKey]/page.tsx`

- [ ] **Step 1: Confirm public routes**

`/widget(.*)` and `/embed.js` must NOT require Clerk auth.

- [ ] **Step 2: Confirm iframe route**

`/widget/[embedKey]` renders `WidgetChat` with embed key from params.

- [ ] **Step 3: Build check**

Run: `pnpm build`  
Expected: `/widget/[embedKey]` listed as dynamic route

---

### Task 10: Phase 2 verification checklist

**Files:**
- Create: `docs/superpowers/verification/phase-2-checklist.md`

- [ ] **Step 1: Document automated checks**

| Check | Command | Expected |
|-------|---------|----------|
| Lint | `pnpm lint` | Pass |
| Build | `pnpm build` | Pass |
| Codegen | `npx convex codegen` | Pass |

- [ ] **Step 2: Document manual E2E flow**

1. Copy embed snippet from `/dashboard/install`
2. Open test HTML page or `/widget/{key}` directly
3. Send message as visitor
4. Open `/dashboard/inbox` — conversation appears with unread badge
5. Assign to me, reply — message appears in widget in real time
6. Close conversation — moves to Closed filter
7. Typing indicators work both directions

- [ ] **Step 3: Run all automated checks**

```bash
pnpm lint
pnpm build
npx convex codegen
```

Fix any errors.

---

## Phase 2 Exit Criteria

- [ ] Embed script loads widget iframe on external page (or direct `/widget/{key}`)
- [ ] Visitor → agent messaging works in real time (both directions)
- [ ] Two-pane inbox with filters: All, Unread, Unassigned, Assigned to me, Closed
- [ ] Assign to me + unassign works
- [ ] Presence viewer count + typing indicators (visitor + agent)
- [ ] Install page shows copy-ready themed snippet
- [ ] `pnpm lint` and `pnpm build` pass

---

## Out of Scope (Phase 2)

- Assign to other agents (dropdown) — Phase 2+ polish
- Message pagination — defer until volume requires it
- Widget AI (`/ai` command) — Phase 7
- Lead capture gate — Phase 4
- KB citations — Phase 3/7

---

## Manual E2E Test HTML (optional)

Save as `test-embed.html` locally (not committed):

```html
<!DOCTYPE html>
<html>
  <body>
    <h1>Widget test page</h1>
    <script src="http://localhost:3000/embed.js" data-key="YOUR_KEY" async></script>
  </body>
</html>
```

Open via `file://` or serve with any static server while `pnpm dev:all` runs.
