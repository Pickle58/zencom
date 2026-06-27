# Phase 2 Verification Checklist

**Date:** 2026-06-27  
**Plan:** [`docs/superpowers/plans/2026-06-26-phase-2-inbox-widget.md`](../plans/2026-06-26-phase-2-inbox-widget.md)

## Automated checks

| Check | Command | Result | Notes |
|-------|---------|--------|-------|
| ESLint | `pnpm lint` | **PASS** | |
| Production build | `pnpm build` | **PASS** | 15 routes including `/widget/[embedKey]` |
| Convex codegen | `npx convex codegen` | **PASS** | Schema index `by_workspace_visitor_status` deployed |

## Schema & backend

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| `visitors` table + index | `by_workspace_session` | **PASS** | `convex/schema.ts` |
| `conversations` table + indexes | status, lastMessage, assigned, visitor_status | **PASS** | Compound index added |
| `messages` table | `by_conversation` | **PASS** | |
| `conversationPresence` table | viewer + typing support | **PASS** | |
| `widgetQuery` / `widgetMutation` | Embed key auth | **PASS** | `convex/lib/customFunctions.ts` |
| `conversations.list` enriched | visitorName, lastMessageBody | **PASS** | |
| `conversations.unassign` | Clears assignee | **PASS** | |
| `visitors.getForAgent` | Org-scoped visitor lookup | **PASS** | |
| Message APIs | list/send agent + widget | **PASS** | `convex/messages.ts` |
| Presence APIs | heartbeat, typing, viewers | **PASS** | `convex/presence.ts` |

## Frontend

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| Two-pane inbox | List + thread | **PASS** | `components/inbox/inbox-view.tsx` |
| Filters | All, Unread, Unassigned, Assigned to me, Closed | **PASS** | |
| Assign / unassign | Buttons wired | **PASS** | |
| Typing indicators | Visitor + other agent | **PASS** | |
| Presence viewer count | Shown in header | **PASS** | |
| Widget iframe | `/widget/[embedKey]` | **PASS** | Public route |
| `embed.js` theming | data-title, data-color, data-position | **PASS** | `public/embed.js` |
| Install page | Live snippet + copy | **PASS** | `/dashboard/install` |
| Settings snippet | Themed attributes | **PASS** | `/dashboard/settings` |
| Public routes | No Clerk auth on widget/embed | **PASS** | `proxy.ts` |

## Manual E2E (requires Phase 1 gate + running dev)

| Step | Expected | Result | Notes |
|------|----------|--------|-------|
| `pnpm dev:all` | Next + Convex running | **MANUAL** | |
| Copy snippet from `/dashboard/install` | Themed script tag | **MANUAL** | |
| Open `/widget/{embedKey}` or test HTML | Widget loads | **MANUAL** | |
| Send message as visitor | Appears in widget | **MANUAL** | |
| Open `/dashboard/inbox` | Conversation with unread badge | **MANUAL** | |
| Assign to me + reply | Message in widget real-time | **MANUAL** | |
| Typing in widget | "Visitor is typing..." in inbox | **MANUAL** | |
| Typing in inbox | Indicator in widget | **MANUAL** | |
| Close conversation | Moves to Closed filter | **MANUAL** | |
| Unassign | Clears assignee badge | **MANUAL** | |

## Phase 2 exit criteria

| Criterion | Result |
|-----------|--------|
| Embed widget on external site | **MANUAL** (code ready) |
| Real-time messaging both directions | **MANUAL** (code ready) |
| Two-pane inbox with 5 filters | **PASS** |
| Assign + unassign | **PASS** |
| Presence + typing | **PASS** |
| Install page with copy-ready snippet | **PASS** |
| `pnpm lint` + `pnpm build` | **PASS** |

## Out of scope (deferred)

- Assign to other agents (dropdown)
- Message pagination
- Widget AI (`/ai`) — Phase 7
- Lead capture — Phase 4

## Optional test HTML

```html
<!DOCTYPE html>
<html>
  <body>
    <h1>Widget test</h1>
    <script
      src="http://localhost:3000/embed.js"
      data-key="YOUR_EMBED_KEY"
      data-title="Support"
      data-color="#2563eb"
      data-position="bottom-right"
      async
    ></script>
  </body>
</html>
```
