# Phase 3 Verification Checklist

**Date:** 2026-06-27  
**Plan:** [`docs/superpowers/plans/2026-06-26-phase-3-kb-rag.md`](../plans/2026-06-26-phase-3-kb-rag.md)

## Automated checks

| Check | Command | Result | Notes |
|-------|---------|--------|-------|
| ESLint | `pnpm lint` | **PASS** | |
| Production build | `pnpm build` | **PASS** | |
| Convex codegen | `npx convex codegen` | **PASS** | |

## Schema & backend

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| `kbCategories` | CRUD indexes | **PASS** | `by_workspace_slug` |
| `kbArticles` | Published + slug indexes | **PASS** | |
| `kbDocuments` | Status + workspace index | **PASS** | |
| `kbChunks` vector index | `by_embedding`, 1536 dims | **PASS** | `workspaceId` filter |
| `@convex-dev/agent` | In `convex.config.ts` | **PASS** | Registered; RAG uses OpenAI + vector search (hybrid) |
| Text ingest pipeline | chunk → embed → ready | **PASS** | `kbDocumentActions.processDocument` |
| Vector search | `vectorSearchKb` + `searchKb` action | **PASS** | Substring fallback without API key |
| `deleteDocument` | Chunks + row removed | **PASS** | |
| Help article CRUD | Backend complete | **PASS** | `kbArticles.ts` |
| Public help queries | Unauthenticated | **PASS** | `helpCenter.ts` |
| Quota checks | KB docs + articles | **PASS** | `lib/usage.ts` |

## Dashboard KB UI

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| Categories create/list | UI wired | **PASS** | `/dashboard/kb` |
| Articles create/delete | Category select, badges | **PASS** | |
| Documents ingest/delete | Status + error display | **PASS** | |
| Help center link | `/help/{slug}` | **PASS** | From `getCurrent` |
| RAG test tab | Answer + citations | **PASS** | Loading + error states |

## Public help center

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| `/help/[slug]` | Published article list | **PASS** | |
| `/help/[slug]/[articleSlug]` | Markdown rendered | **PASS** | `MarkdownBody` + `react-markdown` |
| Public route | No Clerk auth | **PASS** | `proxy.ts` |

## Manual E2E (requires dev + optional OpenAI key)

| Step | Expected | Result | Notes |
|------|----------|--------|-------|
| Set `OPENAI_API_KEY` in Convex | Embeddings + LLM | **MANUAL** | `npx convex env set OPENAI_API_KEY ...` |
| Ingest document (paste text) | Status → `ready`, chunks > 0 | **MANUAL** | |
| RAG test query | Answer + numbered citations | **MANUAL** | |
| Publish help article | Appears on `/help/{slug}` | **MANUAL** | |
| Article page | Markdown headings/lists render | **MANUAL** | |
| Delete document | Removed from list + chunks gone | **MANUAL** | |
| Without OpenAI key | Substring fallback still returns excerpts | **MANUAL** | |

## Phase 3 exit criteria

| Criterion | Result |
|-----------|--------|
| Document ingestion (text) | **PASS** (code) |
| Vector search wired | **PASS** |
| Dashboard RAG with citations | **PASS** |
| Help CRUD from dashboard | **PASS** |
| Public help center | **PASS** |
| No widget AI expansion | **N/A** | Phase 7 code exists; not modified |
| Lint + build | **PASS** |

## Out of scope (deferred)

- PDF/file upload
- Full `@convex-dev/agent` thread streaming — Phase 7
- Public help search
- Category grouping on public help index
