import { v } from "convex/values";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { assertHelpArticleQuota } from "./lib/usage";

const categoryValidator = v.object({
  _id: v.id("kbCategories"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  name: v.string(),
  slug: v.string(),
  sortOrder: v.number(),
});

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "article";
}

export const listCategories = orgQuery({
  args: {},
  returns: v.array(categoryValidator),
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("kbCategories")
      .withIndex("by_workspace_slug", (q) => q.eq("workspaceId", ctx.workspace._id))
      .collect();
    return categories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const createCategory = orgMutation({
  args: { name: v.string() },
  returns: v.id("kbCategories"),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Category name required");

    const existing = await ctx.db
      .query("kbCategories")
      .withIndex("by_workspace_slug", (q) => q.eq("workspaceId", ctx.workspace._id))
      .collect();

    return await ctx.db.insert("kbCategories", {
      workspaceId: ctx.workspace._id,
      name,
      slug: slugify(name),
      sortOrder: existing.length,
    });
  },
});

export const listArticles = orgQuery({
  args: {
    publishedOnly: v.optional(v.boolean()),
  },
  returns: v.array(articleValidator),
  handler: async (ctx, args) => {
    if (args.publishedOnly) {
      return await ctx.db
        .query("kbArticles")
        .withIndex("by_workspace_published", (q) =>
          q.eq("workspaceId", ctx.workspace._id).eq("published", true),
        )
        .collect();
    }

    const articles = await ctx.db
      .query("kbArticles")
      .withIndex("by_workspace_slug", (q) => q.eq("workspaceId", ctx.workspace._id))
      .collect();

    return articles.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const upsertArticle = orgMutation({
  args: {
    articleId: v.optional(v.id("kbArticles")),
    categoryId: v.optional(v.id("kbCategories")),
    title: v.string(),
    bodyMarkdown: v.string(),
    coverImageUrl: v.optional(v.string()),
    published: v.boolean(),
    popular: v.boolean(),
  },
  returns: v.id("kbArticles"),
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (!title) throw new Error("Title required");

    const now = Date.now();

    if (args.articleId) {
      const existing = await ctx.db.get("kbArticles", args.articleId);
      if (!existing || existing.workspaceId !== ctx.workspace._id) {
        throw new Error("Unauthorized");
      }

      await ctx.db.patch("kbArticles", args.articleId, {
        categoryId: args.categoryId,
        title,
        bodyMarkdown: args.bodyMarkdown,
        coverImageUrl: args.coverImageUrl,
        published: args.published,
        popular: args.popular,
        updatedAt: now,
      });
      return args.articleId;
    }

    const count = (
      await ctx.db
        .query("kbArticles")
        .withIndex("by_workspace_slug", (q) => q.eq("workspaceId", ctx.workspace._id))
        .collect()
    ).length;
    await assertHelpArticleQuota(ctx, ctx.workspace, count);

    return await ctx.db.insert("kbArticles", {
      workspaceId: ctx.workspace._id,
      categoryId: args.categoryId,
      title,
      slug: slugify(title),
      bodyMarkdown: args.bodyMarkdown,
      coverImageUrl: args.coverImageUrl,
      published: args.published,
      popular: args.popular,
      updatedAt: now,
    });
  },
});

export const deleteArticle = orgMutation({
  args: { articleId: v.id("kbArticles") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const article = await ctx.db.get("kbArticles", args.articleId);
    if (!article || article.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete("kbArticles", args.articleId);
    return null;
  },
});

export const getArticleBySlug = orgQuery({
  args: { slug: v.string() },
  returns: v.union(articleValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kbArticles")
      .withIndex("by_workspace_slug", (q) =>
        q.eq("workspaceId", ctx.workspace._id).eq("slug", args.slug),
      )
      .unique();
  },
});
