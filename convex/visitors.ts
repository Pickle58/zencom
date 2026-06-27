import { v } from "convex/values";
import { orgQuery, widgetMutation, widgetQuery } from "./lib/customFunctions";
import { widgetSettingsValidator } from "./schema";

const visitorValidator = v.object({
  _id: v.id("visitors"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  sessionToken: v.string(),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  metadata: v.optional(v.record(v.string(), v.string())),
  lastSeenAt: v.number(),
});

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

export const getForAgent = orgQuery({
  args: { visitorId: v.id("visitors") },
  returns: v.union(visitorValidator, v.null()),
  handler: async (ctx, args) => {
    const visitor = await ctx.db.get("visitors", args.visitorId);
    if (!visitor || visitor.workspaceId !== ctx.workspace._id) {
      return null;
    }
    return visitor;
  },
});

export const getWidgetSettings = widgetQuery({
  args: { embedKey: v.string() },
  returns: widgetSettingsValidator,
  handler: async (ctx) => ctx.workspace.widgetSettings,
});
