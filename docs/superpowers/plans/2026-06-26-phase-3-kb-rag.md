# Phase 3 — KB + RAG Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upload documents, manage help articles, serve public help center at `/help/[slug]`, and test RAG retrieval + answers from the dashboard.

**Architecture:** Org-scoped KB via `orgQuery`/`orgMutation`. Document ingestion: mutation → scheduled internal action (chunk + embed) → `kbChunks` vector index. RAG: embed query → vector search → LLM answer with citations. `@convex-dev/agent` registered in `convex.config.ts` for Phase 7; Phase 3 uses direct OpenAI + vector search (hybrid Option C).

**Spec:** [`docs/superpowers/specs/2026-06-26-zencom-phased-design.md`](../specs/2026-06-26-zencom-phased-design.md)

**Depends on:** Phase 0 + 1 (auth, workspaces). Independent of Phase 2.

---

## Current State (pre-plan audit)

| Area | Status |
|------|--------|
| KB schema (4 tables + vector index) | Present |
| Text ingest + chunk + embed pipeline | Present |
| Help center backend CRUD | Present |
| Public `/help/[slug]` routes | MVP |
| Dashboard KB page | Partial UI |
| Vector search in retrieval | **Missing** — substring only |
| RAG citations in dashboard UI | **Missing** |
| Document delete | **Missing** |
| Category create UI | **Missing** |

---

## File Map

| File | Responsibility |
|------|----------------|
| `convex/schema.ts` | `kbCategories`, `kbArticles`, `kbDocuments`, `kbChunks` |
| `convex/kbDocuments.ts` | List, ingest, search |
| `convex/kbDocumentActions.ts` | Chunk + embed processing |
| `convex/kbDocumentInternals.ts` | Store chunks, mark failed |
| `convex/kbArticles.ts` | Categories + articles CRUD |
| `convex/helpCenter.ts` | Public help queries |
| `convex/aiInternals.ts` | `searchKb`, usage, save message |
| `convex/aiActions.ts` | `generateAnswer` |
| `convex/ai.ts` | `askFromDashboard` |
| `convex/convex.config.ts` | `@convex-dev/agent` registration |
| `app/(dashboard)/dashboard/kb/page.tsx` | KB dashboard |
| `app/help/[slug]/*` | Public help center |
| `components/markdown/markdown-body.tsx` | Markdown rendering |
| `docs/superpowers/verification/phase-3-checklist.md` | Verification |

---

## Prerequisites (human)

- [ ] Phase 1 gate complete (org + workspace)
- [ ] Optional: `npx convex env set OPENAI_API_KEY sk-...` for embeddings + LLM
- [ ] Without OpenAI key: ingest uses zero vectors; RAG falls back to substring/excerpt

---

### Task 1: Verify KB schema and agent config

**Files:** Verify `convex/schema.ts`, `convex/convex.config.ts`

- [ ] Confirm all four KB tables and `kbChunks.by_embedding` vector index (1536 dims, `workspaceId` filter)
- [ ] Confirm `@convex-dev/agent` in `convex.config.ts`
- [ ] Run `npx convex codegen`

---

### Task 2: Wire vector search for RAG retrieval

**Files:**
- Modify: `convex/aiInternals.ts`
- Modify: `convex/kbDocumentActions.ts` (shared embed helper)
- Modify: `convex/aiActions.ts`
- Modify: `convex/kbDocuments.ts`

- [ ] **Step 1: Add `embedQueryText` helper** in `kbDocumentActions.ts` (reuse embedding API from `embedTexts`)

- [ ] **Step 2: Add `vectorSearchKb` internalQuery** in `aiInternals.ts`

Use `ctx.vectorSearch("kbChunks", "by_embedding", { vector, limit, filter: q => q.eq("workspaceId", workspaceId) })`, map to citations with document title + excerpt.

- [ ] **Step 3: Replace `searchKb` internalQuery with `searchKb` internalAction**

Embed query → vector search; if no API key or zero vector, fall back to substring match on workspace chunks.

- [ ] **Step 4: Update `aiActions.generateAnswer`** to `ctx.runAction(internal.aiInternals.searchKb, ...)`

- [ ] **Step 5: Add `semanticSearch` orgAction** in `kbDocuments.ts` (or convert `search` to action) for dashboard document search tab

Run: `npx convex codegen && pnpm lint`

---

### Task 3: Document delete API

**Files:**
- Modify: `convex/kbDocuments.ts`
- Modify: `convex/kbDocumentInternals.ts`

- [ ] **Step 1: Add `deleteDocument` orgMutation**

Verify workspace ownership, delete all chunks via `by_document` index, delete document row.

- [ ] **Step 2: Add `deleteChunksForDocument` internalMutation** if needed

Run: `pnpm lint`

---

### Task 4: Help center CRUD UI (dashboard)

**Files:**
- Modify: `app/(dashboard)/dashboard/kb/page.tsx`

- [ ] **Step 1: Category management** — form to call `createCategory`, list categories

- [ ] **Step 2: Article list improvements** — show published badge, delete button (`deleteArticle`), optional category select on create

- [ ] **Step 3: Document list** — delete button calling `deleteDocument`, show error status

- [ ] **Step 4: Help center link** — show `/help/{workspace.slug}` link from `getCurrent`

Run: `pnpm lint`

---

### Task 5: RAG test tab with citations

**Files:**
- Modify: `app/(dashboard)/dashboard/kb/page.tsx`

- [ ] Display `result.citations` from `askFromDashboard` (numbered list with title + excerpt)
- [ ] Show loading state during action
- [ ] Handle errors gracefully

Run: `pnpm lint`

---

### Task 6: Public help center polish

**Files:**
- Create: `components/markdown/markdown-body.tsx`
- Modify: `app/help/[slug]/[articleSlug]/page.tsx`
- Modify: `app/help/[slug]/page.tsx` (optional category labels)

- [ ] **Step 1: MarkdownBody component** — render headings, paragraphs, lists, links from markdown (use `react-markdown` or minimal custom parser)

- [ ] **Step 2: Use MarkdownBody** on article page instead of raw `<pre>`

- [ ] **Step 3: Verify public routes** in `proxy.ts` — `/help(.*)` public

Run: `pnpm lint && pnpm build`

---

### Task 7: Verify help center + ingestion backend

**Files:** Verify `convex/kbArticles.ts`, `convex/helpCenter.ts`, `convex/kbDocumentActions.ts`

- [ ] All public functions have args + returns validators
- [ ] `ingestText` schedules `processDocument` correctly
- [ ] Quota checks via `assertKbDocumentQuota` / `assertHelpArticleQuota`

Run: `pnpm lint`

---

### Task 8: Phase 3 verification checklist

**Files:**
- Create: `docs/superpowers/verification/phase-3-checklist.md`

- [ ] Document automated + manual E2E steps
- [ ] Run `pnpm lint`, `pnpm build`, `npx convex codegen`

---

## Phase 3 Exit Criteria

- [ ] Ingest text document → status `ready` with chunks
- [ ] Vector search returns relevant chunks (with OpenAI key)
- [ ] Dashboard RAG test shows answer + citations
- [ ] Help articles CRUD from dashboard (create, list, delete; categories creatable)
- [ ] Public `/help/{slug}` lists published articles
- [ ] Article page renders markdown
- [ ] `@convex-dev/agent` registered in convex.config
- [ ] `pnpm lint` + `pnpm build` pass

---

## Out of Scope (Phase 3)

- Widget AI (`widgetAi`) — Phase 7 (code may exist; do not expand)
- PDF/file upload — text paste only for MVP
- Full `@convex-dev/agent` thread integration — Phase 7
- Help center search — future polish
