import {
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { mutation, query, type QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import {
  getOrgIdFromIdentity,
  getWorkspaceForOrg,
  type OrgCtx,
} from "./auth";
import { verifyEmbedKey } from "./embedKey";
import type { Doc } from "../_generated/dataModel";

async function resolveOrgCtx(ctx: {
  auth: { getUserIdentity: () => Promise<import("convex/server").UserIdentity | null> };
  db: QueryCtx["db"];
}): Promise<OrgCtx> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const orgId = getOrgIdFromIdentity(identity);
  const workspace = await getWorkspaceForOrg(ctx as QueryCtx, orgId);

  return {
    orgId,
    workspace,
    workspaceId: workspace._id,
  };
}

export const orgQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const org = await resolveOrgCtx(ctx);
    return { ctx: { ...ctx, ...org }, args };
  },
});

export const orgMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const org = await resolveOrgCtx(ctx);
    return { ctx: { ...ctx, ...org }, args };
  },
});

type WidgetCtx = {
  workspace: Doc<"workspaces">;
  embedKey: string;
};

async function resolveWidgetCtx(
  ctx: { db: QueryCtx["db"] },
  embedKey: string,
): Promise<WidgetCtx> {
  const prefix = embedKey.slice(0, 12);
  const candidates = await ctx.db
    .query("workspaces")
    .withIndex("by_embedKeyPrefix", (q) => q.eq("embedKeyPrefix", prefix))
    .collect();
  for (const workspace of candidates) {
    const valid = await verifyEmbedKey(embedKey, workspace.embedKeyHash);
    if (valid) {
      return { workspace, embedKey };
    }
  }
  throw new Error("Invalid embed key");
}

export const widgetQuery = customQuery(query, {
  args: { embedKey: v.string() },
  input: async (ctx, args) => {
    const widget = await resolveWidgetCtx(ctx, args.embedKey);
    return { ctx: { ...ctx, ...widget }, args };
  },
});

export const widgetMutation = customMutation(mutation, {
  args: { embedKey: v.string() },
  input: async (ctx, args) => {
    const widget = await resolveWidgetCtx(ctx, args.embedKey);
    return { ctx: { ...ctx, ...widget }, args };
  },
});
