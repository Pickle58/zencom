import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const syncSubscription = internalMutation({
  args: {
    clerkOrgId: v.string(),
    planSlug: v.string(),
    seatCount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();

    if (!workspace) return null;

    await ctx.db.patch("workspaces", workspace._id, {
      subscriptionSnapshot: {
        planSlug: args.planSlug,
        seatCount: args.seatCount,
        updatedAt: Date.now(),
      },
    });

    return null;
  },
});
