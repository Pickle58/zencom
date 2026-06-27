import { v } from "convex/values";
import { query } from "./_generated/server";

const articleValidator = v.object({
  _id: v.id("kbArticles"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  categoryId: v.optional(v.id("kbCategories")),
  title: v.string(),
  slug: v.string(),
  bodyMarkdown: v.string(),
  coverImageUrl: v.optional(v.string()),
  published: v.boolean(),
  popular: v.boolean(),
  updatedAt: v.number(),
});

export const listPublishedByWorkspaceSlug = query({
  args: { workspaceSlug: v.string() },
  returns: v.array(articleValidator),
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.workspaceSlug))
      .unique();
    if (!workspace) return [];

    return await ctx.db
      .query("kbArticles")
      .withIndex("by_workspace_published", (q) =>
        q.eq("workspaceId", workspace._id).eq("published", true),
      )
      .collect();
  },
});

export const getPublishedArticle = query({
  args: { workspaceSlug: v.string(), articleSlug: v.string() },
  returns: v.union(articleValidator, v.null()),
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.workspaceSlug))
      .unique();
    if (!workspace) return null;

    const article = await ctx.db
      .query("kbArticles")
      .withIndex("by_workspace_slug", (q) =>
        q.eq("workspaceId", workspace._id).eq("slug", args.articleSlug),
      )
      .unique();

    if (!article?.published) return null;
    return article;
  },
});

export const getWorkspaceBySlug = query({
  args: { workspaceSlug: v.string() },
  returns: v.union(
    v.object({
      name: v.string(),
      slug: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.workspaceSlug))
      .unique();
    if (!workspace) return null;
    return { name: workspace.name, slug: workspace.slug };
  },
});
