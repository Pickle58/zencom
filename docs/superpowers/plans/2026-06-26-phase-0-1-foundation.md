# Phase 0 + 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Shadcn, Convex, and Clerk; enable B2B orgs; provision Convex workspaces on org creation; deliver a dashboard shell with org-scoped backend functions.

**Architecture:** Clerk Organizations map 1:1 to Convex `workspaces`. All agent APIs use `orgQuery`/`orgMutation` wrappers from `convex-helpers` — scope from JWT `org_id`, never client args. Phase 1 does not include widget or inbox (Phase 2).

**Tech Stack:** Next.js 16 App Router, `@clerk/nextjs` v7, `convex` v1.42, `convex-helpers`, Shadcn/ui, Tailwind v4

**Spec:** [`docs/superpowers/specs/2026-06-26-zencom-phased-design.md`](../specs/2026-06-26-zencom-phased-design.md)

---

## File Map (Phase 0 + 1)

| File | Responsibility |
|------|----------------|
| `package.json` | Scripts, new deps |
| `.env.example` | Documented env vars (no secrets) |
| `components.json` | Shadcn config |
| `components/ui/*` | Shadcn primitives |
| `components/providers/convex-client-provider.tsx` | Client Convex + Clerk bridge |
| `app/layout.tsx` | Root layout with providers |
| `app/(dashboard)/layout.tsx` | Dashboard shell, sidebar, org switcher |
| `app/(dashboard)/dashboard/page.tsx` | Home dashboard (workspace info) |
| `app/(dashboard)/dashboard/settings/page.tsx` | Embed key display |
| `app/page.tsx` | Redirect signed-in users to dashboard |
| `proxy.ts` | Public routes: `/`, `/sign-in`, `/sign-up`, `/api/webhooks` |
| `convex/schema.ts` | `workspaces` table |
| `convex/auth.config.ts` | Clerk JWT issuer |
| `convex/lib/auth.ts` | `getOrgIdFromIdentity` helper |
| `convex/lib/customFunctions.ts` | `orgQuery`, `orgMutation` |
| `convex/lib/embedKey.ts` | Generate + hash embed keys |
| `convex/workspaces.ts` | `getCurrent` org-scoped query |
| `convex/http.ts` | Clerk webhook route |
| `convex/webhooks/clerkOrganizations.ts` | Org created → workspace |

---

## Prerequisites (human)

Before Task 1, confirm locally:

- Clerk app exists with Convex integration enabled: https://dashboard.clerk.com/apps/setup/convex
- `.env.local` contains:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CLERK_WEBHOOK_SIGNING_SECRET` (for Phase 1 webhook)
  - `NEXT_PUBLIC_CONVEX_URL`
  - `CONVEX_DEPLOYMENT`
- Run `clerk auth login && clerk link` if using Clerk CLI

---

### Task 1: Install dependencies and scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
pnpm add convex-helpers
pnpm add -D @convex-dev/eslint-plugin
```

- [ ] **Step 2: Add scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "convex:dev": "convex dev",
    "dev:all": "convex dev & next dev"
  }
}
```

- [ ] **Step 3: Verify install**

Run: `pnpm install`  
Expected: lockfile updated, no errors

---

### Task 2: Initialize Shadcn

**Files:**
- Create: `components.json`
- Create: `lib/utils.ts`
- Create: `components/ui/button.tsx` (and other init files)
- Modify: `app/globals.css`

- [ ] **Step 1: Run Shadcn init**

```bash
pnpm dlx shadcn@latest init --defaults
```

When prompted for style, use **New York** and **Neutral** (or project preference). Confirm Tailwind v4 compatibility.

- [ ] **Step 2: Add core components**

```bash
pnpm dlx shadcn@latest add button sidebar separator skeleton
```

- [ ] **Step 3: Verify**

Run: `pnpm dev`  
Expected: app builds; no CSS errors

---

### Task 3: Environment documentation

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create `.env.example`**

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# Clerk URLs (optional overrides)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Convex
NEXT_PUBLIC_CONVEX_URL=https://....convex.cloud
CONVEX_DEPLOYMENT=dev:...

# Convex validates Clerk JWT — set in Convex dashboard AND .env.local
CLERK_JWT_ISSUER_DOMAIN=https://....clerk.accounts.dev
```

- [ ] **Step 2: Set Convex env var**

Run: `npx convex env set CLERK_JWT_ISSUER_DOMAIN https://YOUR-CLERK-FRONTEND-API.clerk.accounts.dev`

Use the Frontend API URL from Clerk → Setup → Convex integration page.

---

### Task 4: Convex auth config and schema

**Files:**
- Create: `convex/auth.config.ts`
- Create: `convex/schema.ts`

- [ ] **Step 1: Create `convex/auth.config.ts`**

```typescript
import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

- [ ] **Step 2: Create `convex/schema.ts`**

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const widgetSettingsValidator = v.object({
  primaryColor: v.string(),
  position: v.union(v.literal("bottom-right"), v.literal("bottom-left")),
  title: v.string(),
});

export default defineSchema({
  workspaces: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.string(),
    embedKeyHash: v.string(),
    widgetSettings: widgetSettingsValidator,
    createdAt: v.number(),
  }).index("by_clerkOrgId", ["clerkOrgId"]),
});
```

- [ ] **Step 3: Push schema**

Run: `npx convex dev` (keep running in background)  
Expected: schema deploys; `_generated/` updates

---

### Task 5: Org-scoped custom functions

**Files:**
- Create: `convex/lib/auth.ts`
- Create: `convex/lib/customFunctions.ts`

- [ ] **Step 1: Create `convex/lib/auth.ts`**

```typescript
import type { UserIdentity } from "convex/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type IdentityWithOrg = UserIdentity & {
  org_id?: string;
  orgId?: string;
};

export function getOrgIdFromIdentity(identity: UserIdentity): string {
  const record = identity as IdentityWithOrg;
  const orgId = record.org_id ?? record.orgId;
  if (!orgId) {
    throw new Error("No active organization");
  }
  return orgId;
}

export async function getWorkspaceForOrg(
  ctx: QueryCtx | MutationCtx,
  clerkOrgId: string,
): Promise<Doc<"workspaces">> {
  const workspace = await ctx.db
    .query("workspaces")
    .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", clerkOrgId))
    .unique();

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace;
}

export type OrgCtx = {
  orgId: string;
  workspace: Doc<"workspaces">;
  workspaceId: Id<"workspaces">;
};
```

- [ ] **Step 2: Create `convex/lib/customFunctions.ts`**

```typescript
import {
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { mutation, query } from "../_generated/server";
import {
  getOrgIdFromIdentity,
  getWorkspaceForOrg,
  type OrgCtx,
} from "./auth";

async function resolveOrgCtx(
  ctx: Parameters<typeof getWorkspaceForOrg>[0],
): Promise<OrgCtx> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const orgId = getOrgIdFromIdentity(identity);
  const workspace = await getWorkspaceForOrg(ctx, orgId);

  return {
    orgId,
    workspace,
    workspaceId: workspace._id,
  };
}

export const orgQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const org = await resolveOrgCtx(ctx);
    return {
      ctx: { ...ctx, ...org },
      args,
    };
  },
});

export const orgMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const org = await resolveOrgCtx(ctx);
    return {
      ctx: { ...ctx, ...org },
      args,
    };
  },
});
```

- [ ] **Step 3: Verify Convex compiles**

Expected: `npx convex dev` shows no type errors

---

### Task 6: Embed key utilities

**Files:**
- Create: `convex/lib/embedKey.ts`

- [ ] **Step 1: Create `convex/lib/embedKey.ts`**

```typescript
const EMBED_KEY_PREFIX = "wk_";

export function generateEmbedKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${EMBED_KEY_PREFIX}${token}`;
}

export async function hashEmbedKey(plainKey: string): Promise<string> {
  const data = new TextEncoder().encode(plainKey);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const defaultWidgetSettings = {
  primaryColor: "#2563eb",
  position: "bottom-right" as const,
  title: "Chat with us",
};
```

---

### Task 7: Workspace queries and org provisioning

**Files:**
- Create: `convex/workspaces.ts`
- Create: `convex/webhooks/clerkOrganizations.ts`

- [ ] **Step 1: Create `convex/workspaces.ts`**

```typescript
import { v } from "convex/values";
import { orgQuery } from "./lib/customFunctions";

const workspaceValidator = v.object({
  _id: v.id("workspaces"),
  _creationTime: v.number(),
  clerkOrgId: v.string(),
  name: v.string(),
  slug: v.string(),
  embedKeyHash: v.string(),
  widgetSettings: v.object({
    primaryColor: v.string(),
    position: v.union(v.literal("bottom-right"), v.literal("bottom-left")),
    title: v.string(),
  }),
  createdAt: v.number(),
});

export const getCurrent = orgQuery({
  args: {},
  returns: workspaceValidator,
  handler: async (ctx) => {
    return ctx.workspace;
  },
});
```

- [ ] **Step 2: Create `convex/webhooks/clerkOrganizations.ts`**

```typescript
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import {
  defaultWidgetSettings,
  generateEmbedKey,
  hashEmbedKey,
} from "../lib/embedKey";

export const provisionFromClerkOrg = internalMutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.string(),
  },
  returns: v.object({
    workspaceId: v.id("workspaces"),
    embedKeyPlaintext: v.string(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();

    if (existing) {
      throw new Error("Workspace already exists for organization");
    }

    const embedKeyPlaintext = generateEmbedKey();
    const embedKeyHash = await hashEmbedKey(embedKeyPlaintext);

    const workspaceId = await ctx.db.insert("workspaces", {
      clerkOrgId: args.clerkOrgId,
      name: args.name,
      slug: args.slug,
      embedKeyHash,
      widgetSettings: defaultWidgetSettings,
      createdAt: Date.now(),
    });

    return { workspaceId, embedKeyPlaintext };
  },
});
```

Note: Store `embedKeyPlaintext` in Clerk org `publicMetadata` from the HTTP handler (Task 8) so admins can retrieve it once.

---

### Task 8: Clerk webhook HTTP handler

**Files:**
- Create: `convex/http.ts`

- [ ] **Step 1: Create `convex/http.ts`**

```typescript
import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!signingSecret) {
      return new Response("Missing CLERK_WEBHOOK_SIGNING_SECRET", { status: 500 });
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const body = await request.text();
    const wh = new Webhook(signingSecret);

    type ClerkOrgCreatedEvent = {
      type: string;
      data: {
        id: string;
        name: string;
        slug: string;
      };
    };

    let event: ClerkOrgCreatedEvent;
    try {
      event = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkOrgCreatedEvent;
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }

    if (event.type === "organization.created") {
      await ctx.runMutation(internal.webhooks.clerkOrganizations.provisionFromClerkOrg, {
        clerkOrgId: event.data.id,
        name: event.data.name,
        slug: event.data.slug,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

- [ ] **Step 2: Install svix for webhook verification**

```bash
pnpm add svix
```

- [ ] **Step 3: Register webhook in Clerk Dashboard**

URL: `https://YOUR-DEPLOYMENT.convex.site/clerk-webhook`  
Events: `organization.created`  
Copy signing secret to `CLERK_WEBHOOK_SIGNING_SECRET` and Convex env.

- [ ] **Step 4: Fallback — provision on first dashboard load**

If webhook is delayed, add `convex/workspaces.ts` internal mutation `ensureCurrent` called from dashboard when workspace missing — optional safety net for dev. Implement only if webhook testing is blocked.

---

### Task 9: Convex client provider

**Files:**
- Create: `components/providers/convex-client-provider.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `components/providers/convex-client-provider.tsx`**

```tsx
"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
```

- [ ] **Step 2: Update `app/layout.tsx`**

Wrap children with `ConvexClientProvider` inside `ClerkProvider`. Configure org task URL:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";

// ... fonts unchanged ...

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          taskUrls={{ "choose-organization": "/session-tasks/choose-organization" }}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create org chooser task page**

Create: `app/session-tasks/choose-organization/page.tsx`

```tsx
import { TaskChooseOrganization } from "@clerk/nextjs";

export default function ChooseOrganizationPage() {
  return <TaskChooseOrganization redirectUrlComplete="/dashboard" />;
}
```

---

### Task 10: Route groups and proxy

**Files:**
- Modify: `proxy.ts`
- Modify: `app/page.tsx`
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/dashboard/page.tsx`
- Create: `app/(dashboard)/dashboard/settings/page.tsx`

- [ ] **Step 1: Update `proxy.ts`**

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/session-tasks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

Note: Convex webhooks hit `*.convex.site`, not Next.js — no Next.js webhook route needed for org provisioning.

- [ ] **Step 2: Update `app/page.tsx` — redirect authed users**

```tsx
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold">Zencom</h1>
      <p className="text-muted-foreground">B2B customer messaging platform</p>
      <div className="flex gap-3">
        <Link href="/sign-in" className="underline">Sign in</Link>
        <Link href="/sign-up" className="underline">Sign up</Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create dashboard layout with sidebar**

Create `app/(dashboard)/layout.tsx` using Shadcn `Sidebar` with nav items (Dashboard, Settings) and `<OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/dashboard" afterCreateOrganizationUrl="/dashboard" />`.

- [ ] **Step 4: Create `app/(dashboard)/dashboard/page.tsx`**

Client component using `useQuery(api.workspaces.getCurrent, {})` wrapped in `<Authenticated>` from `convex/react`. Show workspace name, slug, created date. Loading state with `<AuthLoading>`.

- [ ] **Step 5: Create settings page placeholder**

`app/(dashboard)/dashboard/settings/page.tsx` — show message: "Embed key available after organization provisioning (Phase 2 install page)." Display workspace slug.

---

### Task 11: Enable Clerk organizations

- [ ] **Step 1: Enable orgs via CLI**

```bash
clerk enable orgs
```

Confirm **Membership required** in Dashboard → Organizations settings.

- [ ] **Step 2: Verify JWT includes org_id**

Sign in → create org → open Convex dashboard → run test query with `getUserIdentity()` logging. Confirm `org_id` present. If missing, activate Convex integration at https://dashboard.clerk.com/apps/setup/convex and re-sign-in.

---

### Task 12: End-to-end verification

- [ ] **Step 1: Phase 0 checklist**

| Check | Expected |
|-------|----------|
| `pnpm dev` | Next.js starts on :3000 |
| `npx convex dev` | Convex connected, schema deployed |
| Shadcn button renders | No CSS errors |

- [ ] **Step 2: Phase 1 checklist**

| Step | Expected |
|------|----------|
| Sign up new user | Redirected to choose-organization task |
| Create organization | Webhook fires; workspace row in Convex dashboard |
| Land on `/dashboard` | Workspace name displayed via `getCurrent` |
| Switch org (if 2+) | `getCurrent` returns different workspace |
| Call API without auth | Convex throws "Not authenticated" |
| Wrong org resource access | Throws "Unauthorized" (test in Phase 2) |

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```

Fix any ESLint errors introduced.

---

## Phase 1 Exit Criteria

- [ ] User can sign up, create org, and see dashboard shell
- [ ] Convex `workspaces` row exists per Clerk org
- [ ] `orgQuery`/`orgMutation` wrappers enforce org scope
- [ ] `ConvexProviderWithClerk` + `useConvexAuth()` authenticated after login
- [ ] No widget, inbox, KB, or billing UI present

---

## Self-Review (spec coverage)

| Spec requirement | Task |
|------------------|------|
| Phase 0 Shadcn + Convex dev | Task 1–3 |
| Phase 1 auth.config.ts | Task 4 |
| workspaces schema | Task 4 |
| orgQuery/orgMutation | Task 5 |
| org webhook provisioning | Task 7–8 |
| embed key generation | Task 6–7 |
| dashboard + OrganizationSwitcher | Task 10 |
| proxy public routes | Task 10 |
| clerk enable orgs | Task 11 |
| org-scoped client hooks (no workspaceId arg) | Task 10 Step 4 |

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-06-26-phase-0-1-foundation.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — implement tasks in this session with checkpoints

Which approach?
