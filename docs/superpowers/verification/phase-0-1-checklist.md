# Phase 0 + 1 Verification Checklist

**Date:** 2026-06-27  
**Verified by:** Agent (Tasks 11–12)

## Phase 0 — Foundation

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| `package.json` scripts | `dev`, `build`, `lint`, `convex:dev`, `dev:all` | **PASS** | All scripts present |
| Dependencies | `convex-helpers`, `@convex-dev/eslint-plugin` | **PASS** | Installed in `package.json` |
| `.env.example` | Documented env vars | **PASS** | File exists |
| Shadcn init | `components.json`, `components/ui/button.tsx` | **PASS** | Core components present |
| `pnpm lint` | No ESLint errors | **PASS** | Fixed `dashboard-shell.tsx` set-state-in-effect |
| `pnpm build` | Production build succeeds | **PASS** | Next.js 16.2.9 compiled successfully |
| Convex codegen | `npx convex codegen` generates bindings | **PASS** | Completed without errors |
| `pnpm dev` | Next.js starts on :3000 | **MANUAL** | Not run in agent session; build validates compile |
| `npx convex dev` | Convex connected, schema deployed | **MANUAL** | Requires logged-in Convex CLI / running dev server |

## Phase 1 — Auth, orgs, dashboard shell

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| Clerk orgs enabled | `clerk enable orgs` or Dashboard | **MANUAL** | CLI hung/timed out in agent environment; enable via [Dashboard → Organizations settings](https://dashboard.clerk.com/last-active?path=organizations-settings) with **Membership required** |
| JWT includes `org_id` | Present after sign-in with org | **MANUAL** | Requires orgs enabled + Convex integration + live sign-in |
| Sign up → choose org | Redirect to choose-organization task | **MANUAL** | Route exists: `/session-tasks/choose-organization` |
| Create org → workspace row | Webhook provisions Convex `workspaces` | **MANUAL** | Requires Clerk webhook + live org creation |
| `/dashboard` shows workspace | `getCurrent` returns workspace name | **MANUAL** | Requires authenticated session with org |
| Org switcher | Different org → different workspace | **MANUAL** | Requires 2+ orgs and live session |
| Unauthenticated API call | "Not authenticated" | **MANUAL** | `orgQuery`/`orgMutation` enforce auth in code |
| `ConvexProviderWithClerk` | Auth bridge wired | **PASS** | `components/providers/convex-client-provider.tsx` exists |
| `orgQuery` / `orgMutation` | Org-scoped wrappers | **PASS** | `convex/lib/customFunctions.ts` exists |
| `workspaces` schema | Table + indexes | **PASS** | `convex/schema.ts` |
| Clerk webhook route | Org created → workspace | **PASS** | `convex/http.ts`, `convex/webhooks/clerkOrganizations.ts` |

## Phase 1 exit criteria (code-level)

| Criterion | Result |
|-----------|--------|
| Dashboard shell with org switcher layout | **PASS** (build includes dashboard routes) |
| Convex `workspaces` table defined | **PASS** |
| Org-scoped backend wrappers | **PASS** |
| No widget/inbox/KB/billing *requirement* for Phase 1 | **N/A** | Phase 2+ routes exist in codebase by design; not removed per task scope |

## Commands run

```bash
pnpm lint          # PASS
pnpm build         # PASS
npx convex codegen # PASS
clerk enable orgs  # BLOCKED — CLI did not respond (timeout); human step required
```

## Human follow-up (Task 11)

1. On host shell: `clerk auth login && clerk link` (if not already)
2. Run: `clerk enable orgs`
3. Confirm **Membership required** in Clerk Dashboard → Organizations settings
4. Verify JWT `org_id` after sign-in (Convex dashboard → test query with `getUserIdentity()`)
