# Phase 4 Verification Checklist

**Date:** 2026-06-27  
**Plan:** [`docs/superpowers/plans/2026-06-26-phase-4-leads-customizer.md`](../plans/2026-06-26-phase-4-leads-customizer.md)

## Automated checks

| Check | Command | Result | Notes |
|-------|---------|--------|-------|
| ESLint | `pnpm lint` | **PASS** | |
| Production build | `pnpm build` | **PASS** | |
| Convex codegen | `npx convex codegen` | **PASS** | |

## Schema & backend

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| `leads` table | status index, workspace scoped | **PASS** | `by_workspace_status` |
| `widgetSettingsValidator` | proactive + lead fields | **PASS** | includes `proactiveMessage` |
| `leads.list` | Filter by status | **PASS** | |
| `leads.updateStatus` | Status + notes | **PASS** | |
| `leads.captureFromWidget` | Visitor + lead row | **PASS** | embed-key auth |
| `leads.exportCsv` | CSV download | **PASS** | |
| `widgetSettings.get/update` | Dashboard CRUD | **PASS** | |
| `defaultWidgetSettings` | Proactive + lead defaults | **PASS** | `embedKey.ts` |

## Widget customizer

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| Position select | bottom-right / bottom-left | **PASS** | `/dashboard/customize` |
| Lead capture enabled | Checkbox | **PASS** | |
| Require before chat | `leadCaptureRequired` | **PASS** | Fixes gate bug |
| Proactive enabled + delay + message | Saved to workspace | **PASS** | |
| Preview hints | Gate / optional / proactive | **PASS** | |
| Title, color, radius, FAQ | Unchanged | **PASS** | |

## Widget runtime

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| Required lead gate | Blocks chat until capture | **PASS** | `needsLeadGate` |
| Optional lead prompt | Skip + inline form | **PASS** | `optionalLeadPrompt` |
| Theming | borderRadius + primaryColor bubbles | **PASS** | `widget-chat.tsx` |
| Proactive banner | Dismissible, localStorage | **PASS** | `zencom_proactive_dismissed:{embedKey}` |

## embed.js

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| Proactive data attrs | enabled, delay, message | **PASS** | |
| Tooltip + auto-open | After delay | **PASS** | |
| `data-border-radius` | Panel styling | **PASS** | |
| Snippet builder | Proactive attrs when enabled | **PASS** | `embed-key-panel.tsx` |
| Install docs | Optional attrs documented | **PASS** | dashboard + marketing docs |

## Leads dashboard

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| Pipeline table | Name, email, phone, status | **PASS** | |
| Created column | Formatted date | **PASS** | |
| Notes inline edit | Blur → updateStatus | **PASS** | |
| Status filters + All | Clear filter | **PASS** | |
| Reopen closed | status → `new` | **PASS** | |
| CSV export | Download button | **PASS** | |
| Empty / loading states | UX polish | **PASS** | |

## Manual E2E (requires dev + embed key)

| Step | Expected | Result | Notes |
|------|----------|--------|-------|
| Enable lead capture + required | Full-screen gate on widget | **MANUAL** | |
| Optional lead capture | Banner with Skip | **MANUAL** | |
| Submit lead form | Row in `/dashboard/leads` | **MANUAL** | |
| Change status / notes | Persisted | **MANUAL** | |
| Export CSV | File downloads | **MANUAL** | |
| Enable proactive + delay | Tooltip + auto-open on host page | **MANUAL** | |
| Customize position/color | Reflected in widget + embed | **MANUAL** | |

## Phase 4 exit criteria

| Criterion | Result |
|-----------|--------|
| Customizer saves position, colors, lead capture, proactive | **PASS** (code) |
| Lead gate when enabled + required | **PASS** |
| Proactive message in embed + widget | **PASS** |
| Leads table with filters, workflow, CSV | **PASS** |
| Lint + build | **PASS** |

## Out of scope (deferred)

- Logo upload / sound effects
- Proactive A/B testing
- Lead assignment to agents
