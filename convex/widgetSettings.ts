import { v } from "convex/values";
import { orgMutation, orgQuery, widgetQuery } from "./lib/customFunctions";
import { widgetSettingsValidator } from "./schema";

export const get = orgQuery({
  args: {},
  returns: widgetSettingsValidator,
  handler: async (ctx) => ctx.workspace.widgetSettings,
});

export const update = orgMutation({
  args: {
    settings: widgetSettingsValidator,
  },
  returns: widgetSettingsValidator,
  handler: async (ctx, args) => {
    await ctx.db.patch("workspaces", ctx.workspace._id, {
      widgetSettings: args.settings,
    });
    return args.settings;
  },
});

export const getForWidget = widgetQuery({
  args: { embedKey: v.string() },
  returns: widgetSettingsValidator,
  handler: async (ctx) => ctx.workspace.widgetSettings,
});
