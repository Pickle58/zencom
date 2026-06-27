import { v } from "convex/values";
import { orgMutation, orgQuery, widgetMutation } from "./lib/customFunctions";
import { leadStatusValidator } from "./schema";

const leadValidator = v.object({
  _id: v.id("leads"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  visitorId: v.optional(v.id("visitors")),
  conversationId: v.optional(v.id("conversations")),
  name: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  source: v.string(),
  status: leadStatusValidator,
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const list = orgQuery({
  args: {
    status: v.optional(leadStatusValidator),
    search: v.optional(v.string()),
  },
  returns: v.array(leadValidator),
  handler: async (ctx, args) => {
    let leads = await ctx.db
      .query("leads")
      .withIndex("by_workspace_created", (q) => q.eq("workspaceId", ctx.workspace._id))
      .order("desc")
      .collect();

    if (args.status) {
      leads = leads.filter((l) => l.status === args.status);
    }

    if (args.search) {
      const q = args.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.email?.toLowerCase().includes(q) ?? false) ||
          (l.phone?.toLowerCase().includes(q) ?? false),
      );
    }

    return leads;
  },
});

export const updateStatus = orgMutation({
  args: {
    leadId: v.id("leads"),
    status: leadStatusValidator,
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const lead = await ctx.db.get("leads", args.leadId);
    if (!lead || lead.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch("leads", args.leadId, {
      status: args.status,
      notes: args.notes ?? lead.notes,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const captureFromWidget = widgetMutation({
  args: {
    embedKey: v.string(),
    visitorId: v.id("visitors"),
    conversationId: v.optional(v.id("conversations")),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  returns: v.id("leads"),
  handler: async (ctx, args) => {
    const visitor = await ctx.db.get("visitors", args.visitorId);
    if (!visitor || visitor.workspaceId !== ctx.workspace._id) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const name = args.name.trim();
    if (!name) throw new Error("Name required");

    await ctx.db.patch("visitors", args.visitorId, {
      name,
      email: args.email,
      phone: args.phone,
      lastSeenAt: now,
    });

    return await ctx.db.insert("leads", {
      workspaceId: ctx.workspace._id,
      visitorId: args.visitorId,
      conversationId: args.conversationId,
      name,
      email: args.email,
      phone: args.phone,
      source: "widget",
      status: "new",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const exportCsv = orgQuery({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_workspace_created", (q) => q.eq("workspaceId", ctx.workspace._id))
      .collect();

    const header = "name,email,phone,status,source,createdAt";
    const rows = leads.map((l) =>
      [
        JSON.stringify(l.name),
        JSON.stringify(l.email ?? ""),
        JSON.stringify(l.phone ?? ""),
        l.status,
        l.source,
        new Date(l.createdAt).toISOString(),
      ].join(","),
    );
    return [header, ...rows].join("\n");
  },
});
