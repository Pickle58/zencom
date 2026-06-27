import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import {
  defaultWidgetSettings,
  generateEmbedKey,
  getEmbedKeyPrefix,
  hashEmbedKey,
} from "../lib/embedKey";

export const provisionFromClerkOrg = internalMutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.string(),
  },
  returns: v.object({
    workspaceId: v.id("workspaces"),
    embedKeyPlaintext: v.string(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .unique();

    if (existing) {
      return {
        workspaceId: existing._id,
        embedKeyPlaintext: "",
      };
    }

    const embedKeyPlaintext = generateEmbedKey();
    const embedKeyHash = await hashEmbedKey(embedKeyPlaintext);

    const workspaceId = await ctx.db.insert("workspaces", {
      clerkOrgId: args.clerkOrgId,
      name: args.name,
      slug: args.slug,
      embedKeyHash,
      embedKeyPrefix: getEmbedKeyPrefix(embedKeyPlaintext),
      widgetSettings: defaultWidgetSettings,
      createdAt: Date.now(),
    });

    return { workspaceId, embedKeyPlaintext };
  },
});
