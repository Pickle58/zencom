import { v } from "convex/values";
import { orgMutation, orgQuery, widgetMutation, widgetQuery } from "./lib/customFunctions";
import { conversationStatusValidator } from "./schema";

const conversationValidator = v.object({
  _id: v.id("conversations"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  visitorId: v.id("visitors"),
  status: conversationStatusValidator,
  assignedToClerkUserId: v.optional(v.string()),
  lastMessageAt: v.number(),
  unreadByAgent: v.boolean(),
  aiPaused: v.optional(v.boolean()),
  visitorTypingAt: v.optional(v.number()),
  agentTypingAt: v.optional(v.number()),
  agentTypingClerkUserId: v.optional(v.string()),
  lastMessageBody: v.optional(v.string()),
});

const enrichedConversationValidator = v.object({
  ...conversationValidator.fields,
  visitorName: v.union(v.string(), v.null()),
  lastMessageBody: v.union(v.string(), v.null()),
});

export const list = orgQuery({
  args: {
    filter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("closed"),
        v.literal("unread"),
        v.literal("unassigned"),
        v.literal("assigned_to_me"),
      ),
    ),
  },
  returns: v.array(enrichedConversationValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = identity?.subject;

    let conversations = await ctx.db
      .query("conversations")
      .withIndex("by_workspace_lastMessage", (q) => q.eq("workspaceId", ctx.workspace._id))
      .order("desc")
      .collect();

    const filter = args.filter ?? "all";
    if (filter === "all") {
      conversations = conversations.filter((c) => c.status === "open");
    } else if (filter === "closed") {
      conversations = conversations.filter((c) => c.status === "closed");
    } else if (filter === "unread") {
      conversations = conversations.filter((c) => c.unreadByAgent);
    } else if (filter === "unassigned") {
      conversations = conversations.filter((c) => !c.assignedToClerkUserId);
    } else if (filter === "assigned_to_me") {
      conversations = conversations.filter(
        (c) => c.assignedToClerkUserId === clerkUserId,
      );
    }

    const visitorIds = [...new Set(conversations.map((conversation) => conversation.visitorId))];
    const visitors = await Promise.all(
      visitorIds.map((visitorId) => ctx.db.get("visitors", visitorId)),
    );
    const visitorNameById = new Map(
      visitors
        .filter((visitor): visitor is NonNullable<typeof visitor> => visitor !== null)
        .map((visitor) => [visitor._id, visitor.name ?? visitor.email ?? null] as const),
    );

    return conversations.map((conversation) => ({
      ...conversation,
      visitorName: visitorNameById.get(conversation.visitorId) ?? null,
      lastMessageBody: conversation.lastMessageBody ?? null,
    }));
  },
});

export const getOrCreateForVisitor = widgetMutation({
  args: {
    embedKey: v.string(),
    visitorId: v.id("visitors"),
  },
  returns: v.object({ conversationId: v.id("conversations") }),
  handler: async (ctx, args) => {
    const visitor = await ctx.db.get("visitors", args.visitorId);
    if (!visitor || visitor.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    const openConversations = await ctx.db
      .query("conversations")
      .withIndex("by_workspace_visitor_status", (q) =>
        q
          .eq("workspaceId", ctx.workspace._id)
          .eq("visitorId", args.visitorId)
          .eq("status", "open"),
      )
      .collect();

    if (openConversations.length > 0) {
      const existing = openConversations.reduce((latest, conversation) =>
        conversation.lastMessageAt > latest.lastMessageAt ? conversation : latest,
      );
      return { conversationId: existing._id };
    }

    const conversationId = await ctx.db.insert("conversations", {
      workspaceId: ctx.workspace._id,
      visitorId: args.visitorId,
      status: "open",
      lastMessageAt: Date.now(),
      unreadByAgent: false,
    });

    return { conversationId };
  },
});

export const getForWidget = widgetQuery({
  args: {
    embedKey: v.string(),
    conversationId: v.id("conversations"),
  },
  returns: v.object({
    aiPaused: v.boolean(),
    aiEnabled: v.boolean(),
    hasAgentReply: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    return {
      aiPaused: conversation.aiPaused ?? false,
      aiEnabled: ctx.workspace.widgetSettings.aiEnabled ?? true,
      hasAgentReply: messages.some((message) => message.authorType === "agent"),
    };
  },
});

export const assignToMe = orgMutation({
  args: { conversationId: v.id("conversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch("conversations", args.conversationId, {
      assignedToClerkUserId: identity.subject,
    });
    return null;
  },
});

export const takeOver = orgMutation({
  args: { conversationId: v.id("conversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch("conversations", args.conversationId, {
      assignedToClerkUserId: identity.subject,
      aiPaused: true,
    });
    return null;
  },
});

export const unassign = orgMutation({
  args: { conversationId: v.id("conversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch("conversations", args.conversationId, {
      assignedToClerkUserId: undefined,
    });
    return null;
  },
});

export const setStatus = orgMutation({
  args: {
    conversationId: v.id("conversations"),
    status: conversationStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch("conversations", args.conversationId, { status: args.status });
    return null;
  },
});
