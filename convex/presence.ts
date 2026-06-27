import { v } from "convex/values";
import { orgMutation, orgQuery, widgetMutation, widgetQuery } from "./lib/customFunctions";

export const heartbeat = orgMutation({
  args: { conversationId: v.id("conversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("conversationPresence")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("clerkUserId", identity.subject),
      )
      .unique();

    if (existing) {
      await ctx.db.patch("conversationPresence", existing._id, { lastSeenAt: now });
    } else {
      await ctx.db.insert("conversationPresence", {
        workspaceId: ctx.workspace._id,
        conversationId: args.conversationId,
        clerkUserId: identity.subject,
        lastSeenAt: now,
      });
    }

    return null;
  },
});

export const listViewers = orgQuery({
  args: { conversationId: v.id("conversations") },
  returns: v.array(
    v.object({
      clerkUserId: v.string(),
      lastSeenAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    const cutoff = Date.now() - 30_000;
    const presence = await ctx.db
      .query("conversationPresence")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .collect();

    return presence
      .filter((p) => p.lastSeenAt >= cutoff)
      .map((p) => ({ clerkUserId: p.clerkUserId, lastSeenAt: p.lastSeenAt }));
  },
});

export const setAgentTyping = orgMutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch("conversations", args.conversationId, {
      agentTypingAt: args.isTyping ? Date.now() : undefined,
      agentTypingClerkUserId: args.isTyping ? identity.subject : undefined,
    });

    return null;
  },
});

export const setVisitorTyping = widgetMutation({
  args: {
    embedKey: v.string(),
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch("conversations", args.conversationId, {
      visitorTypingAt: args.isTyping ? Date.now() : undefined,
    });

    return null;
  },
});

export const getTypingState = orgQuery({
  args: { conversationId: v.id("conversations") },
  returns: v.object({
    visitorTyping: v.boolean(),
    agentTyping: v.boolean(),
    agentTypingClerkUserId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    const cutoff = Date.now() - 4000;
    return {
      visitorTyping: (conversation.visitorTypingAt ?? 0) >= cutoff,
      agentTyping: (conversation.agentTypingAt ?? 0) >= cutoff,
      agentTypingClerkUserId: conversation.agentTypingClerkUserId ?? null,
    };
  },
});

export const getTypingStateForWidget = widgetQuery({
  args: {
    embedKey: v.string(),
    conversationId: v.id("conversations"),
  },
  returns: v.object({
    visitorTyping: v.boolean(),
    agentTyping: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    const cutoff = Date.now() - 4000;
    return {
      visitorTyping: (conversation.visitorTypingAt ?? 0) >= cutoff,
      agentTyping: (conversation.agentTypingAt ?? 0) >= cutoff,
    };
  },
});
