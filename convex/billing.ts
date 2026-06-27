import { v } from "convex/values";
import { orgQuery } from "./lib/customFunctions";
import { currentMonthKey, getUsageCounter } from "./lib/usage";
import {
  getQuotasForPlan,
  normalizePlanSlug,
  PLAN_LABELS,
  type PlanQuotas,
} from "./lib/plans";
import {
  subscriptionSnapshotValidator,
  subscriptionStatusValidator,
} from "./schema";

const planQuotasValidator = v.object({
  aiMessagesPerMonth: v.number(),
  kbDocuments: v.number(),
  helpArticles: v.union(v.number(), v.null()),
});

export const getSubscription = orgQuery({
  args: {},
  returns: v.object({
    planSlug: v.string(),
    seatCount: v.number(),
    status: v.union(subscriptionStatusValidator, v.null()),
    subscriptionSnapshot: v.union(subscriptionSnapshotValidator, v.null()),
  }),
  handler: async (ctx) => {
    const snapshot = ctx.workspace.subscriptionSnapshot;
    return {
      planSlug: snapshot?.planSlug ?? "org:free",
      seatCount: snapshot?.seatCount ?? 1,
      status: snapshot?.status ?? null,
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
    helpArticles: v.number(),
    quotas: planQuotasValidator,
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

    const helpArticles = (
      await ctx.db
        .query("kbArticles")
        .withIndex("by_workspace_slug", (q) =>
          q.eq("workspaceId", ctx.workspace._id),
        )
        .collect()
    ).length;

    return {
      monthKey,
      aiMessages: usage?.aiMessages ?? 0,
      kbDocuments: docCount,
      helpArticles,
      quotas: {
        aiMessagesPerMonth: quotas.aiMessagesPerMonth,
        kbDocuments: quotas.kbDocuments,
        helpArticles: quotas.helpArticles,
      },
    };
  },
});

export const getPlanDetails = orgQuery({
  args: {},
  returns: v.object({
    planSlug: v.string(),
    planLabel: v.string(),
    seatCount: v.number(),
    status: v.union(subscriptionStatusValidator, v.null()),
    quotas: planQuotasValidator,
  }),
  handler: async (ctx) => {
    const snapshot = ctx.workspace.subscriptionSnapshot;
    const planSlug = normalizePlanSlug(snapshot?.planSlug);
    const quotas: PlanQuotas = getQuotasForPlan(planSlug);

    return {
      planSlug,
      planLabel: PLAN_LABELS[planSlug],
      seatCount: snapshot?.seatCount ?? 1,
      status: snapshot?.status ?? null,
      quotas: {
        aiMessagesPerMonth: quotas.aiMessagesPerMonth,
        kbDocuments: quotas.kbDocuments,
        helpArticles: quotas.helpArticles,
      },
    };
  },
});
