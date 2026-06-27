import { v } from "convex/values";
import { orgMutation } from "./lib/customFunctions";

export const pauseAi = orgMutation({
  args: { conversationId: v.id("conversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch("conversations", args.conversationId, { aiPaused: true });
    return null;
  },
});

export const resumeAi = orgMutation({
  args: { conversationId: v.id("conversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation || conversation.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch("conversations", args.conversationId, { aiPaused: false });
    return null;
  },
});
