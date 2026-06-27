import { v } from "convex/values";
import { internal } from "./_generated/api";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { assertKbDocumentQuota } from "./lib/usage";
import { kbDocumentStatusValidator } from "./schema";

const documentValidator = v.object({
  _id: v.id("kbDocuments"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  title: v.string(),
  fileName: v.string(),
  mimeType: v.string(),
  status: kbDocumentStatusValidator,
  errorMessage: v.optional(v.string()),
  chunkCount: v.number(),
  createdAt: v.number(),
});

export const list = orgQuery({
  args: {},
  returns: v.array(documentValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("kbDocuments")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ctx.workspace._id))
      .order("desc")
      .collect();
  },
});

export const ingestText = orgMutation({
  args: {
    title: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    content: v.string(),
  },
  returns: v.id("kbDocuments"),
  handler: async (ctx, args) => {
    const title = args.title.trim();
    const content = args.content.trim();
    if (!title || !content) throw new Error("Title and content required");

    const existing = await ctx.db
      .query("kbDocuments")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ctx.workspace._id))
      .collect();
    await assertKbDocumentQuota(ctx, ctx.workspace, existing.length);

    const documentId = await ctx.db.insert("kbDocuments", {
      workspaceId: ctx.workspace._id,
      title,
      fileName: args.fileName,
      mimeType: args.mimeType,
      status: "processing",
      chunkCount: 0,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.kbDocumentActions.processDocument, {
      documentId,
      content,
    });

    return documentId;
  },
});

export const search = orgQuery({
  args: { query: v.string(), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      documentId: v.id("kbDocuments"),
      title: v.string(),
      excerpt: v.string(),
      score: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const queryText = args.query.trim().toLowerCase();
    if (!queryText) return [];

    const chunks = await ctx.db.query("kbChunks").collect();
    const workspaceChunks = chunks.filter((c) => c.workspaceId === ctx.workspace._id);
    const matches = workspaceChunks
      .filter((c) => c.text.toLowerCase().includes(queryText))
      .slice(0, args.limit ?? 5);

    const results = [];
    for (const chunk of matches) {
      const doc = await ctx.db.get("kbDocuments", chunk.documentId);
      if (!doc || doc.status !== "ready") continue;
      results.push({
        documentId: chunk.documentId,
        title: doc.title,
        excerpt: chunk.text.slice(0, 200),
        score: 1,
      });
    }

    return results;
  },
});
