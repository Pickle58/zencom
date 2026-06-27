import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getQuotasForPlan, normalizePlanSlug } from "./plans";

export function currentMonthKey(now = Date.now()): string {
  const date = new Date(now);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getUsageCounter(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  monthKey: string,
) {
  return await ctx.db
    .query("usageCounters")
    .withIndex("by_workspace_month", (q) =>
      q.eq("workspaceId", workspaceId).eq("monthKey", monthKey),
    )
    .unique();
}

export async function getOrCreateUsageCounter(
  ctx: MutationCtx,
  workspaceId: Id<"workspaces">,
  monthKey: string,
) {
  const existing = await getUsageCounter(ctx, workspaceId, monthKey);
  if (existing) return existing;

  const id = await ctx.db.insert("usageCounters", {
    workspaceId,
    monthKey,
    aiMessages: 0,
    kbDocuments: 0,
  });

  const created = await ctx.db.get("usageCounters", id);
  if (!created) throw new Error("Failed to create usage counter");
  return created;
}

export function getWorkspacePlanSlug(workspace: Doc<"workspaces">): string {
  return workspace.subscriptionSnapshot?.planSlug ?? "org:free";
}

export async function assertAiQuota(
  ctx: MutationCtx,
  workspace: Doc<"workspaces">,
): Promise<void> {
  const planSlug = normalizePlanSlug(getWorkspacePlanSlug(workspace));
  const quotas = getQuotasForPlan(planSlug);
  const monthKey = currentMonthKey();
  const usage = await getOrCreateUsageCounter(ctx, workspace._id, monthKey);

  if (usage.aiMessages >= quotas.aiMessagesPerMonth) {
    throw new Error("AI message quota exceeded for your plan");
  }
}

export async function incrementAiUsage(
  ctx: MutationCtx,
  workspaceId: Id<"workspaces">,
): Promise<void> {
  const monthKey = currentMonthKey();
  const usage = await getOrCreateUsageCounter(ctx, workspaceId, monthKey);
  await ctx.db.patch("usageCounters", usage._id, {
    aiMessages: usage.aiMessages + 1,
  });
}

export async function assertKbDocumentQuota(
  ctx: MutationCtx,
  workspace: Doc<"workspaces">,
  currentCount: number,
): Promise<void> {
  const quotas = getQuotasForPlan(getWorkspacePlanSlug(workspace));
  if (currentCount >= quotas.kbDocuments) {
    throw new Error("KB document quota exceeded for your plan");
  }
}

export async function assertHelpArticleQuota(
  ctx: MutationCtx,
  workspace: Doc<"workspaces">,
  currentCount: number,
): Promise<void> {
  const quotas = getQuotasForPlan(getWorkspacePlanSlug(workspace));
  if (quotas.helpArticles !== null && currentCount >= quotas.helpArticles) {
    throw new Error("Help article quota exceeded for your plan");
  }
}
