"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getOrgIdFromIdentity } from "./lib/auth";

const semanticSearchReturnValidator = v.array(
  v.object({
    documentId: v.id("kbDocuments"),
    title: v.string(),
    excerpt: v.string(),
    score: v.number(),
  }),
);

type SemanticSearchResult = Array<{
  documentId: Id<"kbDocuments">;
  title: string;
  excerpt: string;
  score: number;
}>;

export const semanticSearch = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: semanticSearchReturnValidator,
  handler: async (ctx, args): Promise<SemanticSearchResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const orgId = getOrgIdFromIdentity(identity);
    const context = await ctx.runQuery(internal.aiInternals.resolveContext, {
      orgId,
    });
    if (!context) throw new Error("Workspace not found");

    const results = await ctx.runAction(internal.kbDocumentActions.searchKb, {
      workspaceId: context.workspaceId,
      query: args.query,
      limit: args.limit,
    });

    return results.map((result) => ({
      ...result,
      score: 1,
    }));
  },
});
