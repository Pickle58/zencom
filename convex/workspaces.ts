import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { orgQuery } from "./lib/customFunctions";
import { getOrgIdFromIdentity } from "./lib/auth";
import {
  defaultWidgetSettings,
  generateEmbedKey,
  getEmbedKeyPrefix,
  hashEmbedKey,
} from "./lib/embedKey";
import { widgetSettingsValidator } from "./schema";
import type { Doc } from "./_generated/dataModel";

const workspaceReturnValidator = v.object({
  _id: v.id("workspaces"),
  _creationTime: v.number(),
  clerkOrgId: v.string(),
  name: v.string(),
  slug: v.string(),
  embedKeyPrefix: v.string(),
  widgetSettings: widgetSettingsValidator,
  createdAt: v.number(),
});

function toPublicWorkspace(workspace: Doc<"workspaces">) {
  const { embedKeyHash, ...safe } = workspace;
  void embedKeyHash;
  return safe;
}

export const getCurrent = orgQuery({
  args: {},
  returns: workspaceReturnValidator,
  handler: async (ctx) => toPublicWorkspace(ctx.workspace),
});

export const ensureCurrent = mutation({
  args: {},
  returns: v.object({
    workspace: workspaceReturnValidator,
    embedKeyPlaintext: v.union(v.string(), v.null()),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const orgId = getOrgIdFromIdentity(identity);
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", orgId))
      .unique();

    if (existing) {
      return {
        workspace: toPublicWorkspace(existing),
        embedKeyPlaintext: null,
      };
    }

    const embedKeyPlaintext = generateEmbedKey();
    const embedKeyHash = await hashEmbedKey(embedKeyPlaintext);
    const workspaceId = await ctx.db.insert("workspaces", {
      clerkOrgId: orgId,
      name: "My Workspace",
      slug: orgId.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "workspace",
      embedKeyHash,
      embedKeyPrefix: getEmbedKeyPrefix(embedKeyPlaintext),
      widgetSettings: defaultWidgetSettings,
      createdAt: Date.now(),
    });

    const workspace = await ctx.db.get("workspaces", workspaceId);
    if (!workspace) throw new Error("Failed to create workspace");

    return {
      workspace: toPublicWorkspace(workspace),
      embedKeyPlaintext,
    };
  },
});
