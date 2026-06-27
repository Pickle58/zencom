import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { assertAiQuota, incrementAiUsage } from "./lib/usage";
import { verifyEmbedKey } from "./lib/embedKey";

export const resolveContext = internalQuery({
  args: {
    orgId: v.string(),
    workspaceId: v.optional(v.id("workspaces")),
    embedKey: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      workspaceId: v.id("workspaces"),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return { workspaceId: args.workspaceId };
    }

    if (args.embedKey) {
      const prefix = args.embedKey.slice(0, 12);
      const candidates = await ctx.db
        .query("workspaces")
        .withIndex("by_embedKeyPrefix", (q) => q.eq("embedKeyPrefix", prefix))
        .collect();
      for (const workspace of candidates) {
        if (await verifyEmbedKey(args.embedKey, workspace.embedKeyHash)) {
          return { workspaceId: workspace._id };
        }
      }
      return null;
    }

    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.orgId))
      .unique();
    if (!workspace) return null;
    return { workspaceId: workspace._id };
  },
});

export const searchKb = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    query: v.string(),
  },
  returns: v.array(
    v.object({
      documentId: v.id("kbDocuments"),
      title: v.string(),
      excerpt: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const q = args.query.trim().toLowerCase();
    if (!q) return [];

    const chunks = await ctx.db.query("kbChunks").collect();
    const matches = chunks
      .filter((c) => c.workspaceId === args.workspaceId && c.text.toLowerCase().includes(q))
      .slice(0, 5);

    const results = [];
    for (const chunk of matches) {
      const doc = await ctx.db.get("kbDocuments", chunk.documentId);
      if (!doc || doc.status !== "ready") continue;
      results.push({
        documentId: chunk.documentId,
        title: doc.title,
        excerpt: chunk.text.slice(0, 200),
      });
    }
    return results;
  },
});

export const assertAndIncrementAiUsage = internalMutation({
  args: { workspaceId: v.id("workspaces") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get("workspaces", args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");
    await assertAiQuota(ctx, workspace);
    await incrementAiUsage(ctx, workspace._id);
    return null;
  },
});

export const saveAiMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    workspaceId: v.id("workspaces"),
    body: v.string(),
    citations: v.array(
      v.object({
        documentId: v.id("kbDocuments"),
        title: v.string(),
        excerpt: v.string(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      workspaceId: args.workspaceId,
      authorType: "ai",
      body: args.body,
      createdAt: now,
      citations: args.citations,
    });
    await ctx.db.patch("conversations", args.conversationId, {
      lastMessageAt: now,
      unreadByAgent: true,
    });
    return null;
  },
});

export const getConversation = internalQuery({
  args: { conversationId: v.id("conversations") },
  returns: v.union(
    v.object({
      workspaceId: v.id("workspaces"),
      aiPaused: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation) return null;
    return {
      workspaceId: conversation.workspaceId,
      aiPaused: conversation.aiPaused ?? false,
    };
  },
});
