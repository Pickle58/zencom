# Phase 6 Verification Checklist

**Date:** 2026-06-27  
**Plan:** [`docs/superpowers/plans/2026-06-26-phase-6-marketing.md`](../plans/2026-06-26-phase-6-marketing.md)

## Automated checks

| Check | Command | Result | Notes |
|-------|---------|--------|-------|
| ESLint | `pnpm lint` | **PASS** | |
| Production build | `pnpm build` | **PASS** | |
| Routes include `/`, `/pricing`, `/docs/install` | `pnpm build` output | **PASS** | |

## Marketing routes

| Route | Expected | Result | Notes |
|-------|----------|--------|-------|
| `/` | Landing hero + features | **PASS** | Redirects authed users to dashboard |
| `/pricing` | Clerk `PricingTable for="organization"` | **PASS** | Requires Clerk billing (manual) |
| `/docs/install` | Install guide + embed snippet | **PASS** | |
| Public access (no auth) | proxy.ts matcher | **PASS** | `/`, `/pricing`, `/docs` |

## Layout & components

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| `(marketing)/layout.tsx` | Nav + main + footer | **PASS** | |
| `MarketingNav` | Pricing, Install, auth CTAs | **PASS** | |
| `MarketingFooter` | Links + copyright | **PASS** | |
| `MarketingHero` | 3 CTAs incl. install | **PASS** | |
| `FeatureGrid` | 3 feature cards | **PASS** | |

## Page metadata

| Page | Title | Result |
|------|-------|--------|
| Landing | Zencom — Real-time customer messaging | **PASS** |
| Pricing | Pricing — Zencom | **PASS** |
| Install | Install widget — Zencom | **PASS** |

## Install docs quality

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| Snippet uses `/embed.js` | Relative path | **PASS** | |
| Optional data attrs documented | title, color, position | **PASS** | |
| Sign-up link | `/sign-up` | **PASS** | |
| Customize link | `/dashboard/customize` | **PASS** | |

## Cross-links

| From | To | Result |
|------|-----|--------|
| Landing hero | `/docs/install` | **PASS** |
| `/dashboard/billing` | `/pricing` | **PASS** |
| `/dashboard/install` | `/docs/install` | **PASS** |
| Nav (all marketing) | Pricing, Install | **PASS** |
| Pricing page | `/sign-up` CTA | **PASS** |

## Manual E2E

| Step | Expected | Result | Notes |
|------|----------|--------|-------|
| Visit `/` signed out | Hero + features + footer | **MANUAL** | |
| Visit `/` signed in | Redirect to `/dashboard` | **MANUAL** | |
| Visit `/pricing` | PricingTable renders | **MANUAL** | Needs Clerk billing |
| Visit `/docs/install` | Guide readable, no auth | **MANUAL** | |
| Mobile nav | Links accessible | **MANUAL** | |

## Phase 6 exit criteria

| Criterion | Result |
|-----------|--------|
| Landing with CTAs | **PASS** |
| Org PricingTable | **PASS** (code; Clerk setup manual) |
| Install docs | **PASS** |
| Shared layout | **PASS** |
| Public routes | **PASS** |
| Lint + build | **PASS** |

## Wave A complete

With Phase 6 done, Wave A deliverables are verified:

| Phase | Status |
|-------|--------|
| 2 — Inbox + widget | Plan + checklist |
| 3 — KB + RAG | Plan + checklist |
| 5 — Billing | Plan + checklist |
| 6 — Marketing | Plan + checklist |

Next: **Wave B** — Phase 4 (Leads + customizer) → Phase 7 (Widget AI).
