import { v } from "convex/values";
import { orgMutation, orgQuery, widgetMutation } from "./lib/customFunctions";
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
});

export const list = orgQuery({
  args: {
    filter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("unread"),
        v.literal("unassigned"),
        v.literal("assigned_to_me"),
      ),
    ),
  },
  returns: v.array(conversationValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = identity?.subject;

    let conversations = await ctx.db
      .query("conversations")
      .withIndex("by_workspace_lastMessage", (q) => q.eq("workspaceId", ctx.workspace._id))
      .order("desc")
      .collect();

    const filter = args.filter ?? "all";
    if (filter === "unread") {
      conversations = conversations.filter((c) => c.unreadByAgent);
    } else if (filter === "unassigned") {
      conversations = conversations.filter((c) => !c.assignedToClerkUserId);
    } else if (filter === "assigned_to_me") {
      conversations = conversations.filter(
        (c) => c.assignedToClerkUserId === clerkUserId,
      );
    }

    return conversations;
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

    const open = await ctx.db
      .query("conversations")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspaceId", ctx.workspace._id).eq("status", "open"),
      )
      .collect();

    const existing = open.find((c) => c.visitorId === args.visitorId);
    if (existing) return { conversationId: existing._id };

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
