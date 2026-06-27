# Phase 5 Verification Checklist

**Date:** 2026-06-27  
**Plan:** [`docs/superpowers/plans/2026-06-26-phase-5-billing.md`](../plans/2026-06-26-phase-5-billing.md)

## Automated checks

| Check | Command | Result | Notes |
|-------|---------|--------|-------|
| ESLint | `pnpm lint` | **PASS** | |
| Production build | `pnpm build` | **PASS** | |
| Convex codegen | `npx convex codegen` | **PASS** | |

## Schema & backend

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| `usageCounters` table | `by_workspace_month` index | **PASS** | |
| `subscriptionSnapshot` | planSlug, seatCount, status, updatedAt | **PASS** | |
| `PLAN_QUOTAS` | Free/Pro/Scale per spec | **PASS** | `convex/lib/plans.ts` |
| `PLAN_LABELS` | Display names | **PASS** | |
| AI quota enforcement | `assertAiQuota` before generation | **PASS** | `convex/aiInternals.ts` |
| KB doc quota | `assertKbDocumentQuota` on ingest | **PASS** | `convex/kbDocuments.ts` |
| Help article quota | `assertHelpArticleQuota` on create | **PASS** | `convex/kbArticles.ts` |
| Subscription webhook | Full snapshot sync | **PASS** | `syncSubscription` |
| Membership webhook | Seat count only | **PASS** | `syncSeatCount` — no plan overwrite |
| `getPlanDetails` | Label + quotas + status | **PASS** | |
| `getUsage` | AI + KB + help articles | **PASS** | |

## Frontend

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| Billing page plan card | Label, slug, status, seats | **PASS** | `/dashboard/billing` |
| Usage meters | Three quotas with progress | **PASS** | `UsageMeter` component |
| Compare plans link | `/pricing` | **PASS** | |
| OrganizationProfile gate | Admin or billing manage | **PASS** | Clerk `Show` |
| Plan upgrade hint | KB RAG tab free plan | **PASS** | Clerk `Show` |
| `PlanGate` component | Pro/Scale gate helper | **PASS** | `components/billing/plan-gate.tsx` |
| Pricing page | `<PricingTable for="organization" />` | **PASS** | Phase 6, pre-existing |

## Manual E2E (requires Clerk billing setup)

| Step | Expected | Result | Notes |
|------|----------|--------|-------|
| `clerk enable billing --for org` | Org plans enabled | **MANUAL** | |
| Create plans `org:free/pro/scale` | Slugs match Convex | **MANUAL** | |
| Subscribe org to Pro | Webhook fires | **MANUAL** | |
| Convex workspace snapshot | planSlug + status updated | **MANUAL** | Check Convex dashboard |
| `/dashboard/billing` | Shows Pro plan + usage | **MANUAL** | |
| Exceed AI quota on Free | Error on RAG query | **MANUAL** | |
| Add/remove org member | Seat count updates, plan unchanged | **MANUAL** | |
| Non-admin views billing | Usage visible, profile hidden | **MANUAL** | |

## Phase 5 exit criteria

| Criterion | Result |
|-----------|--------|
| Webhook sync without membership overwrite | **PASS** (code) |
| Dashboard plan + usage display | **PASS** |
| Server-side quota enforcement | **PASS** |
| Clerk `has({ plan })` in UI | **PASS** |
| Billing admin gate on OrganizationProfile | **PASS** |
| Lint + build | **PASS** |

## Out of scope (deferred)

- `@convex-dev/rate-limiter` enforcement (usageCounters used instead)
- Custom seat limit enforcement in app (Clerk handles)
- `has({ feature })` for custom Clerk features (optional Dashboard setup)

## Clerk setup commands (reference)

```bash
clerk auth login && clerk link
clerk enable billing --for org
# Configure plans in Dashboard → Billing with slugs org:free, org:pro, org:scale
```
