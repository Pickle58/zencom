import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";

export async function deleteChunksForDocumentHelper(
  ctx: MutationCtx,
  documentId: Id<"kbDocuments">,
): Promise<void> {
  const chunks = await ctx.db
    .query("kbChunks")
    .withIndex("by_document", (q) => q.eq("documentId", documentId))
    .collect();

  for (const chunk of chunks) {
    await ctx.db.delete("kbChunks", chunk._id);
  }
}

export const storeChunks = internalMutation({
  args: {
    documentId: v.id("kbDocuments"),
    chunks: v.array(
      v.object({
        chunkIndex: v.number(),
        text: v.string(),
        embedding: v.array(v.float64()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const document = await ctx.db.get("kbDocuments", args.documentId);
    if (!document) throw new Error("Document not found");

    for (const chunk of args.chunks) {
      await ctx.db.insert("kbChunks", {
        workspaceId: document.workspaceId,
        documentId: args.documentId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        embedding: chunk.embedding,
      });
    }

    await ctx.db.patch("kbDocuments", args.documentId, {
      status: "ready",
      chunkCount: args.chunks.length,
    });

    return null;
  },
});

export const deleteChunksForDocument = internalMutation({
  args: { documentId: v.id("kbDocuments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await deleteChunksForDocumentHelper(ctx, args.documentId);
    return null;
  },
});

export const markFailed = internalMutation({
  args: {
    documentId: v.id("kbDocuments"),
    errorMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("kbDocuments", args.documentId, {
      status: "failed",
      errorMessage: args.errorMessage,
    });
    return null;
  },
});
