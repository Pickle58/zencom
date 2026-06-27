# Phase 4 — Leads + Widget Customizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Customize widget appearance/behavior; capture leads from widget; manage lead pipeline with CSV export.

**Architecture:** Widget settings stored on `workspaces.widgetSettings`. Widget APIs use embed-key auth. Lead capture writes `visitors` + `leads` rows. Proactive behavior via embed.js data attributes + in-widget banner.

**Spec:** [`docs/superpowers/specs/2026-06-26-zencom-phased-design.md`](../specs/2026-06-26-zencom-phased-design.md)

**Depends on:** Phase 2 (widget + inbox)

---

## Current State (pre-plan audit)

| Area | Status |
|------|--------|
| `leads` schema + API | Mostly complete |
| CSV export | Complete |
| Leads dashboard | Mostly complete |
| Widget customizer | Partial |
| Lead capture gate | Bug — `leadCaptureRequired` not wired in UI |
| Proactive messages | Schema flags only, no runtime |
| embed.js proactive | Missing |

---

## File Map

| File | Responsibility |
|------|----------------|
| `convex/schema.ts` | `leads`, `widgetSettingsValidator` |
| `convex/leads.ts` | Pipeline CRUD + CSV |
| `convex/widgetSettings.ts` | Settings get/update |
| `convex/lib/embedKey.ts` | Default settings |
| `app/(dashboard)/dashboard/customize/page.tsx` | Customizer UI |
| `app/(dashboard)/dashboard/leads/page.tsx` | Pipeline UI |
| `components/widget/widget-chat.tsx` | Lead gate + theming |
| `public/embed.js` | Proactive auto-open |
| `components/dashboard/embed-key-panel.tsx` | Snippet with proactive attrs |
| `docs/superpowers/verification/phase-4-checklist.md` | Verification |

---

### Task 1: Verify leads schema and API

- [ ] Confirm `leads` table + indexes
- [ ] Confirm `list`, `updateStatus`, `captureFromWidget`, `exportCsv`
- [ ] Run `npx convex codegen`

---

### Task 2: Schema + proactive message field

**Files:** `convex/schema.ts`, `convex/lib/embedKey.ts`, `convex/visitors.ts`

- [ ] Add `proactiveMessage: v.optional(v.string())` to `widgetSettingsValidator`
- [ ] Add default `proactiveMessage: "Hi! How can we help?"` in `defaultWidgetSettings`
- [ ] Update `getWidgetSettings` returns validator if needed

---

### Task 3: embed.js proactive behavior

**Files:** `public/embed.js`, `components/dashboard/embed-key-panel.tsx`, install/settings snippets

- [ ] Read `data-proactive-enabled`, `data-proactive-delay`, `data-proactive-message`
- [ ] After delay, show tooltip bubble above launcher with message
- [ ] Auto-open panel once (if enabled)
- [ ] Extend `buildSnippet` with proactive data attributes from workspace settings

---

### Task 4: Widget customizer UI

**Files:** `app/(dashboard)/dashboard/customize/page.tsx`

- [ ] Position select (bottom-right / bottom-left)
- [ ] Lead capture: enabled + "Require before chat" (`leadCaptureRequired`)
- [ ] Proactive: enabled, delay (ms), message text
- [ ] Optional lead capture hint in preview
- [ ] On save, when leadCaptureEnabled checked, document that required gate blocks chat

---

### Task 5: Widget runtime — lead gate + theming

**Files:** `components/widget/widget-chat.tsx`

- [ ] Fix gate: show when `leadCaptureEnabled && leadCaptureRequired && !leadDone`; optional soft prompt when enabled but not required (banner with skip)
- [ ] Apply `borderRadius` to widget container
- [ ] Visitor message bubbles use `primaryColor`
- [ ] Proactive in-widget banner on first visit when `proactiveEnabled` + message (dismissible, localStorage key)

---

### Task 6: Leads pipeline polish

**Files:** `app/(dashboard)/dashboard/leads/page.tsx`

- [ ] Add Phone, Created columns
- [ ] Notes inline edit or dialog on status update
- [ ] Empty state when no leads
- [ ] "Reopen" action (status → new) for closed leads
- [ ] Loading skeleton

---

### Task 7: Verification checklist + build

**Files:** `docs/superpowers/verification/phase-4-checklist.md`

- [ ] Run `pnpm lint`, `pnpm build`, `npx convex codegen`

---

## Phase 4 Exit Criteria

- [ ] Customizer saves position, colors, lead capture, proactive settings
- [ ] Lead gate works when enabled + required
- [ ] Proactive message shows in embed.js + widget
- [ ] Leads table with filters, status workflow, CSV export
- [ ] `pnpm lint` + `pnpm build` pass

---

## Out of Scope

- Logo upload / sound effects
- Proactive message A/B testing
- Lead assignment to agents
