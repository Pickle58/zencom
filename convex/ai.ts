"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

export const askFromDashboard = action({
  args: { query: v.string() },
  returns: v.object({
    answer: v.string(),
    citations: v.array(
      v.object({
        documentId: v.id("kbDocuments"),
        title: v.string(),
        excerpt: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args): Promise<{
    answer: string;
    citations: Array<{
      documentId: import("./_generated/dataModel").Id<"kbDocuments">;
      title: string;
      excerpt: string;
    }>;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const orgId =
      (identity as { org_id?: string; orgId?: string }).org_id ??
      (identity as { org_id?: string; orgId?: string }).orgId ??
      identity.subject;

    return await ctx.runAction(internal.aiActions.generateAnswer, {
      query: args.query,
      orgId,
    });
  },
});
