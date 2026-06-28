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

const kbSearchResultValidator = v.array(
  v.object({
    documentId: v.id("kbDocuments"),
    title: v.string(),
    excerpt: v.string(),
  }),
);

export const vectorSearchKb = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    chunkIds: v.array(v.id("kbChunks")),
    limit: v.optional(v.number()),
  },
  returns: kbSearchResultValidator,
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const results = [];
    const seenDocumentIds = new Set<string>();

    for (const chunkId of args.chunkIds) {
      if (results.length >= limit) break;

      const chunk = await ctx.db.get("kbChunks", chunkId);
      if (!chunk || chunk.workspaceId !== args.workspaceId) continue;

      const documentKey = chunk.documentId as string;
      if (seenDocumentIds.has(documentKey)) continue;

      const doc = await ctx.db.get("kbDocuments", chunk.documentId);
      if (!doc || doc.status !== "ready") continue;

      seenDocumentIds.add(documentKey);
      results.push({
        documentId: chunk.documentId,
        title: doc.title,
        excerpt: chunk.text.slice(0, 200),
      });
    }

    return results;
  },
});

export const searchKbSubstring = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: kbSearchResultValidator,
  handler: async (ctx, args) => {
    const q = args.query.trim().toLowerCase();
    if (!q) return [];

    const limit = args.limit ?? 5;
    const documents = await ctx.db
      .query("kbDocuments")
      .withIndex("by_workspace", (query) =>
        query.eq("workspaceId", args.workspaceId),
      )
      .collect();

    const results = [];
    const seenDocumentIds = new Set<string>();

    for (const doc of documents) {
      if (results.length >= limit) break;
      if (doc.status !== "ready") continue;

      const chunks = await ctx.db
        .query("kbChunks")
        .withIndex("by_document", (query) => query.eq("documentId", doc._id))
        .collect();

      for (const chunk of chunks) {
        if (!chunk.text.toLowerCase().includes(q)) continue;
        if (seenDocumentIds.has(doc._id)) break;

        seenDocumentIds.add(doc._id);
        results.push({
          documentId: doc._id,
          title: doc.title,
          excerpt: chunk.text.slice(0, 200),
        });
        break;
      }
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
      lastMessageBody: args.body,
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

const citationValidator = v.object({
  documentId: v.id("kbDocuments"),
  title: v.string(),
  excerpt: v.string(),
});

export const getWorkspaceForEmbedKey = internalQuery({
  args: { embedKey: v.string() },
  returns: v.union(
    v.object({
      workspaceId: v.id("workspaces"),
      aiEnabled: v.boolean(),
      aiAutoReply: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const prefix = args.embedKey.slice(0, 12);
    const candidates = await ctx.db
      .query("workspaces")
      .withIndex("by_embedKeyPrefix", (q) => q.eq("embedKeyPrefix", prefix))
      .collect();
    for (const workspace of candidates) {
      if (await verifyEmbedKey(args.embedKey, workspace.embedKeyHash)) {
        return {
          workspaceId: workspace._id,
          aiEnabled: workspace.widgetSettings.aiEnabled ?? true,
          aiAutoReply: workspace.widgetSettings.aiAutoReply ?? true,
        };
      }
    }
    return null;
  },
});

export const createStreamingAiMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    workspaceId: v.id("workspaces"),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== args.workspaceId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      workspaceId: args.workspaceId,
      authorType: "ai",
      body: "",
      createdAt: now,
      streamStatus: "streaming",
    });
    await ctx.db.patch("conversations", args.conversationId, {
      lastMessageAt: now,
      lastMessageBody: "",
    });
    return messageId;
  },
});

export const appendAiMessageBody = internalMutation({
  args: {
    messageId: v.id("messages"),
    delta: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get("messages", args.messageId);
    if (!message) throw new Error("Message not found");
    const body = message.body + args.delta;
    await ctx.db.patch("messages", args.messageId, { body });
    await ctx.db.patch("conversations", message.conversationId, {
      lastMessageBody: body,
    });
    return null;
  },
});

export const finalizeAiMessage = internalMutation({
  args: {
    messageId: v.id("messages"),
    citations: v.array(citationValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get("messages", args.messageId);
    if (!message) throw new Error("Message not found");
    const now = Date.now();
    await ctx.db.patch("messages", args.messageId, {
      citations: args.citations,
      streamStatus: "complete",
    });
    await ctx.db.patch("conversations", message.conversationId, {
      lastMessageAt: now,
      unreadByAgent: true,
    });
    return null;
  },
});

export const failAiMessage = internalMutation({
  args: {
    messageId: v.id("messages"),
    errorBody: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get("messages", args.messageId);
    if (!message) throw new Error("Message not found");
    await ctx.db.patch("messages", args.messageId, {
      body: args.errorBody,
      streamStatus: "failed",
    });
    await ctx.db.patch("conversations", message.conversationId, {
      lastMessageBody: args.errorBody,
    });
    return null;
  },
});
