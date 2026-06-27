"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

export const askFromWidget = action({
  args: {
    embedKey: v.string(),
    conversationId: v.id("conversations"),
    query: v.string(),
  },
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
    return await ctx.runAction(internal.aiActions.generateAnswer, {
      query: args.query,
      orgId: args.embedKey,
      conversationId: args.conversationId,
      embedKey: args.embedKey,
    });
  },
});
