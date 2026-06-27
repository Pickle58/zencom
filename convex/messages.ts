import { v } from "convex/values";
import { internal } from "./_generated/api";
import { orgMutation, orgQuery, widgetMutation, widgetQuery } from "./lib/customFunctions";
import { authorTypeValidator, streamStatusValidator } from "./schema";

const messageValidator = v.object({
  _id: v.id("messages"),
  _creationTime: v.number(),
  conversationId: v.id("conversations"),
  workspaceId: v.id("workspaces"),
  authorType: authorTypeValidator,
  authorClerkUserId: v.optional(v.string()),
  body: v.string(),
  createdAt: v.number(),
  citations: v.optional(
    v.array(
      v.object({
        documentId: v.id("kbDocuments"),
        title: v.string(),
        excerpt: v.string(),
      }),
    ),
  ),
  streamStatus: v.optional(streamStatusValidator),
});

export const listForAgent = orgQuery({
  args: { conversationId: v.id("conversations") },
  returns: v.array(messageValidator),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
  },
});

export const listForWidget = widgetQuery({
  args: {
    embedKey: v.string(),
    conversationId: v.id("conversations"),
  },
  returns: v.array(messageValidator),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
  },
});

export const sendFromVisitor = widgetMutation({
  args: {
    embedKey: v.string(),
    conversationId: v.id("conversations"),
    body: v.string(),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    const trimmed = args.body.trim();
    if (!trimmed) throw new Error("Message cannot be empty");

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      workspaceId: ctx.workspace._id,
      authorType: "visitor",
      body: trimmed,
      createdAt: now,
    });

    await ctx.db.patch("conversations", args.conversationId, {
      lastMessageAt: now,
      unreadByAgent: true,
      lastMessageBody: trimmed,
    });

    if (!trimmed.startsWith("/ai ")) {
      await ctx.scheduler.runAfter(0, internal.aiActions.autoReplyFromVisitor, {
        embedKey: args.embedKey,
        conversationId: args.conversationId,
        visitorMessageBody: trimmed,
      });
    }

    return messageId;
  },
});

export const sendFromAgent = orgMutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.string(),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    const trimmed = args.body.trim();
    if (!trimmed) throw new Error("Message cannot be empty");

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      workspaceId: ctx.workspace._id,
      authorType: "agent",
      authorClerkUserId: identity.subject,
      body: trimmed,
      createdAt: now,
    });

    await ctx.db.patch("conversations", args.conversationId, {
      lastMessageAt: now,
      unreadByAgent: false,
      aiPaused: true,
      lastMessageBody: trimmed,
    });

    return messageId;
  },
});

export const markRead = orgMutation({
  args: { conversationId: v.id("conversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch("conversations", args.conversationId, { unreadByAgent: false });
    return null;
  },
});
