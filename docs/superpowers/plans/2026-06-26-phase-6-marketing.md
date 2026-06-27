# Phase 6 — Marketing & Install Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Public landing page, org pricing with Clerk `PricingTable`, and install documentation — closing Wave A.

**Architecture:** Marketing routes live under `app/(marketing)/` as public pages (no auth). Signed-in users on `/` redirect to dashboard. Install docs use placeholder snippet; live keys come from dashboard after sign-up.

**Spec:** [`docs/superpowers/specs/2026-06-26-zencom-phased-design.md`](../specs/2026-06-26-zencom-phased-design.md)

**Depends on:** Phase 0 + 1 (auth routes). Pricing table requires Phase 5 Clerk billing (manual setup).

---

## Current State (pre-plan audit)

| Area | Status |
|------|--------|
| Landing `/` | MVP — inline hero + features |
| Pricing `/pricing` | Complete — `PricingTable for="organization"` |
| Install docs `/docs/install` | Basic — placeholder snippet |
| `MarketingNav` | Complete |
| `(marketing)/layout.tsx` | Missing |
| Marketing footer | Missing |
| Page metadata | Root only |

---

## File Map

| File | Responsibility |
|------|----------------|
| `app/(marketing)/layout.tsx` | Shared shell: nav + footer |
| `app/(marketing)/page.tsx` | Landing hero + features + CTAs |
| `app/(marketing)/pricing/page.tsx` | PricingTable + plan summary |
| `app/(marketing)/docs/install/page.tsx` | Public install guide |
| `components/marketing/marketing-nav.tsx` | Header nav |
| `components/marketing/marketing-footer.tsx` | Footer links |
| `components/marketing/marketing-hero.tsx` | Reusable hero |
| `components/marketing/feature-grid.tsx` | Feature cards |
| `proxy.ts` | Public route matcher |
| `docs/superpowers/verification/phase-6-checklist.md` | Verification |

---

## Prerequisites (human)

- [ ] Phase 5 Clerk billing enabled for org pricing table to render plans
- [ ] `pnpm dev` serves marketing pages without auth

---

### Task 1: Verify public routes and pricing page

**Files:** Verify `proxy.ts`, `app/(marketing)/pricing/page.tsx`

- [ ] Confirm `/`, `/pricing`, `/docs(.*)` in public routes
- [ ] Confirm `<PricingTable for="organization" />` present
- [ ] Run `pnpm build` — routes listed

---

### Task 2: Marketing layout and footer

**Files:**
- Create: `app/(marketing)/layout.tsx`
- Create: `components/marketing/marketing-footer.tsx`

- [ ] Layout wraps children with `MarketingNav`, `<main>`, `MarketingFooter`
- [ ] Footer: links to Pricing, Install, Sign up; copyright line
- [ ] Remove duplicate nav/footer shell from individual pages (pages only render content)

Run: `pnpm lint`

---

### Task 3: Extract marketing components

**Files:**
- Create: `components/marketing/marketing-hero.tsx`
- Create: `components/marketing/feature-grid.tsx`
- Modify: `app/(marketing)/page.tsx`

- [ ] Hero: tagline, H1, description, CTAs (Start free, View pricing, Install guide)
- [ ] Feature grid: Live inbox, Embeddable widget, KB + AI (same content, extracted)
- [ ] Landing keeps signed-in redirect to `/dashboard`
- [ ] Add `export const metadata` on landing page

Run: `pnpm lint`

---

### Task 4: Enhance install docs

**Files:** Modify `app/(marketing)/docs/install/page.tsx`

- [ ] Use relative snippet: `src="/embed.js"` with placeholder `data-key`
- [ ] Document optional attrs: `data-title`, `data-color`, `data-position`
- [ ] Link to `/sign-up`, `/dashboard/install` (for signed-in users note)
- [ ] Add metadata title/description
- [ ] Mention Customize page for widget theming

Run: `pnpm lint`

---

### Task 5: Pricing page polish

**Files:** Modify `app/(marketing)/pricing/page.tsx`

- [ ] Add page metadata
- [ ] Remove duplicate outer shell if layout handles nav/footer
- [ ] Add CTA below table: "Start free" → `/sign-up`
- [ ] Quota summary table matching spec (optional compact table)

Run: `pnpm lint`

---

### Task 6: Marketing metadata

**Files:** Add metadata to marketing pages

- [ ] Landing: title "Zencom — Real-time customer messaging"
- [ ] Pricing: title "Pricing — Zencom"
- [ ] Install: title "Install widget — Zencom"

---

### Task 7: Cross-link verification

**Files:** Verify dashboard ↔ marketing links

- [ ] `/dashboard/billing` → `/pricing` (exists)
- [ ] `/dashboard/install` → `/docs/install` (exists)
- [ ] Landing → `/docs/install` CTA (Task 3)
- [ ] Nav includes Pricing + Install on all marketing pages

---

### Task 8: Phase 6 verification checklist

**Files:** Create `docs/superpowers/verification/phase-6-checklist.md`

- [ ] Document automated + manual checks
- [ ] Run `pnpm lint`, `pnpm build`

---

## Phase 6 Exit Criteria

- [ ] Landing page with hero, features, CTAs (sign-up, pricing, install)
- [ ] `/pricing` renders Clerk `PricingTable for="organization"`
- [ ] `/docs/install` has complete install guide with embed snippet
- [ ] Shared marketing layout with nav + footer
- [ ] All marketing routes public (no auth required)
- [ ] `pnpm lint` + `pnpm build` pass

---

## Out of Scope

- Blog, changelog, legal pages
- Marketing screenshots / video
- SEO sitemap / robots (future)
- Localized copy
