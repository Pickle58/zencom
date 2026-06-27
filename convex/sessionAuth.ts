import { v } from "convex/values";
import { query } from "./_generated/server";
import { getOrgIdFromIdentity } from "./lib/auth";

/** Lightweight check that Convex received org claims from the Clerk JWT. */
export const getActiveOrgId = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    try {
      return getOrgIdFromIdentity(identity);
    } catch {
      return null;
    }
  },
});
