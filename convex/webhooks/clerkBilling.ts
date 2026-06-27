import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { subscriptionStatusValidator } from "../schema";

export const syncSubscription = internalMutation({
  args: {
    clerkOrgId: v.string(),
    planSlug: v.string(),
    seatCount: v.number(),
    status: v.optional(subscriptionStatusValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();

    if (!workspace) return null;

    const existing = workspace.subscriptionSnapshot;

    await ctx.db.patch("workspaces", workspace._id, {
      subscriptionSnapshot: {
        planSlug: args.planSlug,
        seatCount: args.seatCount,
        status: args.status ?? existing?.status,
        updatedAt: Date.now(),
      },
    });

    return null;
  },
});

export const syncSeatCount = internalMutation({
  args: {
    clerkOrgId: v.string(),
    seatCount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();

    if (!workspace) return null;

    const existing = workspace.subscriptionSnapshot;

    await ctx.db.patch("workspaces", workspace._id, {
      subscriptionSnapshot: {
        planSlug: existing?.planSlug ?? "org:free",
        seatCount: args.seatCount,
        status: existing?.status,
        updatedAt: Date.now(),
      },
    });

    return null;
  },
});
