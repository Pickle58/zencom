import { v } from "convex/values";
import { widgetMutation, widgetQuery } from "./lib/customFunctions";

export const getOrCreate = widgetMutation({
  args: {
    embedKey: v.string(),
    sessionToken: v.string(),
  },
  returns: v.object({ visitorId: v.id("visitors") }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("visitors")
      .withIndex("by_workspace_session", (q) =>
        q.eq("workspaceId", ctx.workspace._id).eq("sessionToken", args.sessionToken),
      )
      .unique();

    if (existing) {
      await ctx.db.patch("visitors", existing._id, { lastSeenAt: Date.now() });
      return { visitorId: existing._id };
    }

    const visitorId = await ctx.db.insert("visitors", {
      workspaceId: ctx.workspace._id,
      sessionToken: args.sessionToken,
      lastSeenAt: Date.now(),
    });

    return { visitorId };
  },
});

export const getWidgetSettings = widgetQuery({
  args: { embedKey: v.string() },
  returns: v.object({
    title: v.string(),
    primaryColor: v.string(),
    position: v.union(v.literal("bottom-right"), v.literal("bottom-left")),
    leadCaptureEnabled: v.optional(v.boolean()),
    leadCaptureRequired: v.optional(v.boolean()),
    faqShortcuts: v.optional(v.array(v.string())),
  }),
  handler: async (ctx) => ctx.workspace.widgetSettings,
});
