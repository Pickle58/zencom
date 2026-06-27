# Phase 5 — Billing & Plans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clerk per-seat org billing synced to Convex; usage quotas enforced; dashboard shows plan + usage; Clerk `has({ plan })` gates premium UI.

**Architecture:** Clerk handles seat billing and plan subscriptions. Convex stores `subscriptionSnapshot` on `workspaces` (display + quota lookup). Usage enforced via `usageCounters` + `assert*Quota()` in Convex (rate-limiter component registered but not required for MVP). Webhook at `/clerk-webhook` syncs subscription events.

**Spec:** [`docs/superpowers/specs/2026-06-26-zencom-phased-design.md`](../specs/2026-06-26-zencom-phased-design.md)

**Depends on:** Phase 0 + 1 (orgs, workspaces)

---

## Current State (pre-plan audit)

| Area | Status |
|------|--------|
| `PLAN_QUOTAS` (Free/Pro/Scale) | Complete |
| `usageCounters` + AI/KB/article quotas | Complete |
| `getSubscription` / `getUsage` | Partial — no help article count on UI |
| Clerk webhook billing sync | Risk — membership events overwrite plan to free |
| `subscriptionSnapshot` | Missing `status` field |
| Billing dashboard page | Basic |
| `has({ plan })` / `has({ feature })` | Missing |
| `@convex-dev/rate-limiter` | Registered, unused (keep `usageCounters` as source of truth) |

---

## Locked plan pricing (reference)

| Plan | Slug | AI msgs/mo | KB docs | Help articles |
|------|------|------------|---------|---------------|
| Free | `org:free` | 100 | 5 | 10 |
| Pro | `org:pro` | 2,000 | 50 | unlimited |
| Scale | `org:scale` | 10,000 | 500 | unlimited |

Configure in Clerk: `clerk enable billing --for org` + plan slugs `org:free`, `org:pro`, `org:scale`.

---

## File Map

| File | Responsibility |
|------|----------------|
| `convex/lib/plans.ts` | Quota config + plan labels |
| `convex/lib/usage.ts` | Quota assert/increment |
| `convex/billing.ts` | Subscription + usage queries |
| `convex/schema.ts` | `subscriptionSnapshot`, `usageCounters` |
| `convex/http.ts` | Webhook routing |
| `convex/webhooks/clerkBilling.ts` | Sync mutations |
| `app/(dashboard)/dashboard/billing/page.tsx` | Billing UI |
| `components/billing/plan-gate.tsx` | Clerk `Show` plan gate + upgrade CTA |
| `components/billing/usage-meter.tsx` | Usage progress display |
| `docs/superpowers/verification/phase-5-checklist.md` | Verification |

---

## Prerequisites (human)

- [ ] `clerk enable billing --for org`
- [ ] Create plans with slugs `org:free`, `org:pro`, `org:scale` in Clerk Dashboard
- [ ] Webhook includes `subscription.*` events (same `/clerk-webhook` endpoint)
- [ ] Optional: attach Features to plans for `has({ feature })` checks

---

### Task 1: Verify billing schema and plan config

**Files:** Verify `convex/schema.ts`, `convex/lib/plans.ts`, `convex/lib/usage.ts`

- [ ] Confirm `usageCounters` table + `by_workspace_month` index
- [ ] Confirm `subscriptionSnapshot` on workspaces
- [ ] Confirm `PLAN_QUOTAS` matches spec
- [ ] Run `npx convex codegen`

---

### Task 2: Harden billing webhook sync

**Files:**
- Modify: `convex/schema.ts` — add optional `status` to `subscriptionSnapshotValidator`
- Modify: `convex/http.ts`
- Modify: `convex/webhooks/clerkBilling.ts`

- [ ] **Step 1:** Add `syncSubscription` — full snapshot (plan, seats, status) for `subscription.created`, `subscription.updated`, `subscriptionItem.updated`

- [ ] **Step 2:** Add `syncSeatCount` — updates only `seatCount` for `organizationMembership.created/deleted` without changing plan

- [ ] **Step 3:** Parse `status` from subscription webhook payload (`active`, `canceled`, `past_due`, etc.)

- [ ] **Step 4:** Skip sync when membership events lack org id

Run: `npx convex codegen && pnpm lint`

---

### Task 3: Enhance billing queries

**Files:** Modify `convex/billing.ts`, `convex/lib/plans.ts`

- [ ] Add `PLAN_LABELS` map (slug → display name)
- [ ] Extend `getUsage` to include `helpArticles` count (from `kbArticles` index)
- [ ] Extend `getSubscription` to return `status` from snapshot
- [ ] Add `getPlanDetails` orgQuery returning plan label + quotas + features list (for dashboard)

Run: `pnpm lint`

---

### Task 4: Billing dashboard UI

**Files:**
- Create: `components/billing/usage-meter.tsx`
- Modify: `app/(dashboard)/dashboard/billing/page.tsx`

- [ ] Plan card: display name, slug, status badge, seat count
- [ ] Usage meters: AI messages, KB documents, help articles (with "unlimited" for null quota)
- [ ] Link to `/pricing` for upgrade
- [ ] Wrap `OrganizationProfile` in `<Show when={(has) => has({ role: 'org:admin' }) || has({ permission: 'org:sys_billing:manage' })}>` with fallback message for non-admins

Run: `pnpm lint`

---

### Task 5: Clerk plan feature gates

**Files:**
- Create: `components/billing/plan-gate.tsx`
- Modify: `app/(dashboard)/dashboard/kb/page.tsx` (RAG tab upgrade hint)

- [ ] `PlanGate` component using Clerk `<Show when={(has) => has({ plan: 'org:pro' }) || has({ plan: 'org:scale' })}>` with children + upgrade fallback linking to `/dashboard/billing`

- [ ] On KB RAG tab: show subtle upgrade note for free plan users (client-side via `useAuth().has` or `<Show>`)

- [ ] Optional: gate "Customize" nav item label with plan badge — skip if too invasive

Run: `pnpm lint`

---

### Task 6: Quota enforcement verification

**Files:** Verify `convex/aiInternals.ts`, `convex/kbDocuments.ts`, `convex/kbArticles.ts`

- [ ] Confirm `assertAiQuota` called before AI generation
- [ ] Confirm `assertKbDocumentQuota` on ingest
- [ ] Confirm `assertHelpArticleQuota` on article create
- [ ] Error messages are user-friendly

No code changes unless gaps found.

---

### Task 7: `.env.example` billing docs

**Files:** Modify `.env.example`

- [ ] Document that Clerk billing is configured in Dashboard (not env vars)
- [ ] Note webhook events needed for billing sync

---

### Task 8: Phase 5 verification checklist

**Files:** Create `docs/superpowers/verification/phase-5-checklist.md`

- [ ] Document automated checks + manual E2E (subscribe, webhook sync, quota block)
- [ ] Run `pnpm lint`, `pnpm build`, `npx convex codegen`

---

## Phase 5 Exit Criteria

- [ ] Webhook syncs plan + seats without membership overwrite bug
- [ ] Dashboard billing shows plan, status, seats, all three usage meters
- [ ] Quotas enforced server-side for AI, KB docs, help articles
- [ ] Clerk `has({ plan })` used for at least one premium UI gate
- [ ] `OrganizationProfile` gated to billing admins
- [ ] `pnpm lint` + `pnpm build` pass

---

## Out of Scope

- Custom seat math (Clerk handles per-seat billing)
- `@convex-dev/rate-limiter` integration (usageCounters sufficient for MVP)
- Stripe direct integration
- Phase 6 pricing page changes (already has PricingTable)
