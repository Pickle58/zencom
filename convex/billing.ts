import { v } from "convex/values";
import { orgQuery } from "./lib/customFunctions";
import { currentMonthKey, getUsageCounter } from "./lib/usage";
import { getQuotasForPlan } from "./lib/plans";
import { subscriptionSnapshotValidator } from "./schema";

export const getSubscription = orgQuery({
  args: {},
  returns: v.object({
    planSlug: v.string(),
    seatCount: v.number(),
    subscriptionSnapshot: v.union(subscriptionSnapshotValidator, v.null()),
  }),
  handler: async (ctx) => {
    const snapshot = ctx.workspace.subscriptionSnapshot;
    return {
      planSlug: snapshot?.planSlug ?? "org:free",
      seatCount: snapshot?.seatCount ?? 1,
      subscriptionSnapshot: snapshot ?? null,
    };
  },
});

export const getUsage = orgQuery({
  args: {},
  returns: v.object({
    monthKey: v.string(),
    aiMessages: v.number(),
    kbDocuments: v.number(),
    quotas: v.object({
      aiMessagesPerMonth: v.number(),
      kbDocuments: v.number(),
      helpArticles: v.union(v.number(), v.null()),
    }),
  }),
  handler: async (ctx) => {
    const monthKey = currentMonthKey();
    const usage = await getUsageCounter(ctx, ctx.workspace._id, monthKey);
    const quotas = getQuotasForPlan(ctx.workspace.subscriptionSnapshot?.planSlug);

    const docCount = (
      await ctx.db
        .query("kbDocuments")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", ctx.workspace._id))
        .collect()
    ).length;

    return {
      monthKey,
      aiMessages: usage?.aiMessages ?? 0,
      kbDocuments: docCount,
      quotas: {
        aiMessagesPerMonth: quotas.aiMessagesPerMonth,
        kbDocuments: quotas.kbDocuments,
        helpArticles: quotas.helpArticles,
      },
    };
  },
});
