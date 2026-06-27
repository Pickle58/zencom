import type { UserIdentity } from "convex/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type IdentityWithOrg = UserIdentity & {
  org_id?: string;
  orgId?: string;
  o?: { id?: string };
};

function readOrgId(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function getOrgIdFromIdentity(identity: UserIdentity): string {
  const record = identity as IdentityWithOrg & Record<string, unknown>;

  const orgId =
    readOrgId(record.org_id) ??
    readOrgId(record.orgId) ??
    readOrgId(record.o?.id) ??
    readOrgId(record["o.id"]);

  if (!orgId) {
    throw new Error("No active organization");
  }
  return orgId;
}

export async function getWorkspaceForOrg(
  ctx: QueryCtx | MutationCtx,
  clerkOrgId: string,
): Promise<Doc<"workspaces">> {
  const workspace = await ctx.db
    .query("workspaces")
    .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", clerkOrgId))
    .unique();

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace;
}

export type OrgCtx = {
  orgId: string;
  workspace: Doc<"workspaces">;
  workspaceId: Id<"workspaces">;
};
