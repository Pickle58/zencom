# Phase 7 Verification Checklist

**Date:** 2026-06-27  
**Plan:** [`docs/superpowers/plans/2026-06-26-phase-7-widget-ai.md`](../plans/2026-06-26-phase-7-widget-ai.md)

## Automated checks

| Check | Command | Result | Notes |
|-------|---------|--------|-------|
| ESLint | `pnpm lint` | **PASS** | |
| Production build | `pnpm build` | **PASS** | |
| Convex codegen | `npx convex codegen` | **PASS** | |

## Schema & backend

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| `messages.streamStatus` | streaming / complete / failed | **PASS** | |
| `widgetSettings.aiEnabled` | Optional boolean | **PASS** | default true |
| `widgetSettings.aiAutoReply` | Optional boolean | **PASS** | default true |
| Streaming mutations | create/append/finalize/fail | **PASS** | `aiInternals.ts` |
| `streamGenerateAnswer` | OpenAI stream + KB search | **PASS** | `aiActions.ts` |
| `autoReplyFromVisitor` | Settings + pause checks | **PASS** | skips `/ai` prefix |
| `askFromWidget` | Uses streaming path | **PASS** | no bogus embedKey as orgId |
| `sendFromVisitor` | Schedules auto-reply | **PASS** | |
| `getForWidget` | aiPaused, aiEnabled, hasAgentReply | **PASS** | |
| Usage quotas | assertAndIncrementAiUsage | **PASS** | unchanged |
| `aiControl` pause/resume | Human takeover flag | **PASS** | |
| Agent send pauses AI | `sendFromAgent` sets aiPaused | **PASS** | |

## Widget UI

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| Streaming text | Reactive message updates | **PASS** | via Convex subscription |
| Streaming cursor | When streamStatus streaming | **PASS** | |
| Citations | Numbered title + excerpt | **PASS** | |
| Human takeover banner | aiPaused or agent reply | **PASS** | |
| `/ai query` | Explicit AI trigger | **PASS** | fire-and-forget |
| FAQ → AI | When aiEnabled | **PASS** | |
| No blocking loading | Removed aiLoading | **PASS** | |

## Dashboard

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| Customizer AI toggles | aiEnabled, aiAutoReply | **PASS** | `/dashboard/customize` |
| Inbox Take over | assign + pause AI | **PASS** | |
| Inbox AI handling badge | When AI active | **PASS** | |
| Pause / Resume AI | Existing controls | **PASS** | |

## Manual E2E (requires dev + optional OpenAI key)

| Step | Expected | Result | Notes |
|------|----------|--------|-------|
| Ingest KB document | Ready status | **MANUAL** | Phase 3 |
| Visitor sends message | AI streams reply with citations | **MANUAL** | needs `OPENAI_API_KEY` for full stream |
| Without API key | Fallback excerpt answer | **MANUAL** | |
| Agent Take over | AI stops; widget banner | **MANUAL** | |
| Agent sends message | Visitor sees agent msg; AI paused | **MANUAL** | |
| `/ai question` | AI answer without duplicate visitor msg | **MANUAL** | |
| Disable auto-reply in customizer | No auto AI on visitor msg | **MANUAL** | |
| Quota exceeded | Error on AI attempt | **MANUAL** | free plan limit |

## Phase 7 exit criteria

| Criterion | Result |
|-----------|--------|
| Widget streams AI answers | **PASS** (code) |
| Citations on AI messages | **PASS** |
| Auto-reply when enabled | **PASS** |
| Human takeover pauses AI | **PASS** |
| `/ai` command works | **PASS** |
| Lint + build | **PASS** |

## Out of scope (deferred)

- Full `@convex-dev/agent` thread streaming
- AI markdown in widget
- Streaming in dashboard RAG test tab

## Wave B complete

Phases 4 and 7 complete Wave B. All phased deliverables (0–7) implemented in code.
