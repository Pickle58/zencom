"use client";

import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

const CHOOSE_ORG_PATH = "/session-tasks/choose-organization";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const { isAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const router = useRouter();
  const ensureCurrent = useMutation(api.workspaces.ensureCurrent);
  const [workspaceState, setWorkspaceState] = useState<{
    orgId: string | null;
    ready: boolean;
    error: string | null;
  }>({ orgId: null, ready: false, error: null });

  const canCheckConvexOrg =
    isLoaded && isSignedIn && !!orgId && !isConvexAuthLoading && isAuthenticated;

  const convexOrgId = useQuery(
    api.sessionAuth.getActiveOrgId,
    canCheckConvexOrg ? {} : "skip",
  );

  const workspaceReady =
    typeof convexOrgId === "string" &&
    workspaceState.orgId === convexOrgId &&
    workspaceState.ready;
  const workspaceError =
    typeof convexOrgId === "string" && workspaceState.orgId === convexOrgId
      ? workspaceState.error
      : null;

  const needsOrganization = isLoaded && isSignedIn && !orgId;
  const isWaitingForConvexOrg =
    canCheckConvexOrg && convexOrgId === undefined;
  const convexOrgMissing = canCheckConvexOrg && convexOrgId === null;
  const authReadyForWorkspace =
    canCheckConvexOrg && typeof convexOrgId === "string";

  useEffect(() => {
    if (needsOrganization) {
      router.replace(CHOOSE_ORG_PATH);
    }
  }, [needsOrganization, router]);

  useEffect(() => {
    if (!authReadyForWorkspace || typeof convexOrgId !== "string") {
      return;
    }

    let cancelled = false;

    void ensureCurrent({})
      .then(() => {
        if (!cancelled) {
          setWorkspaceState({
            orgId: convexOrgId,
            ready: true,
            error: null,
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setWorkspaceState({
            orgId: convexOrgId,
            ready: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to set up workspace",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authReadyForWorkspace, convexOrgId, ensureCurrent]);

  if (!isLoaded || isConvexAuthLoading || needsOrganization) {
    return <DashboardLoadingSkeleton />;
  }

  if (!isSignedIn) {
    return <DashboardLoadingSkeleton />;
  }

  if (isWaitingForConvexOrg) {
    return <DashboardLoadingSkeleton message="Loading workspace…" />;
  }

  if (convexOrgMissing) {
    return (
      <DashboardLoadingSkeleton message="Organization token not ready. Sign out and back in, or pick your org again." />
    );
  }

  if (authReadyForWorkspace && !workspaceReady) {
    return (
      <DashboardLoadingSkeleton
        message={workspaceError ?? "Setting up workspace…"}
      />
    );
  }

  return children;
}

function DashboardLoadingSkeleton({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden w-64 shrink-0 border-r p-4 md:block">
        <Skeleton className="mb-6 h-6 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <Skeleton className="h-14 w-full rounded-none" />
        <div className="flex flex-1 flex-col gap-4 p-4">
          {message ? (
            <p className="text-muted-foreground text-sm">{message}</p>
          ) : null}
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full max-w-xl" />
        </div>
      </div>
    </div>
  );
}
