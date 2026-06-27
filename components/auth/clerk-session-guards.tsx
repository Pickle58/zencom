"use client";

import { RedirectToTasks, useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const ORG_TASK_PATH = "/session-tasks/choose-organization";
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/help", "/widget", ORG_TASK_PATH];

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/docs/") ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function RequireOrganization() {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || orgId) return;
    if (pathname.startsWith(ORG_TASK_PATH)) return;
    if (isPublicPath(pathname)) return;

    router.replace(ORG_TASK_PATH);
  }, [isLoaded, isSignedIn, orgId, pathname, router]);

  return null;
}

export function ClerkSessionGuards() {
  return (
    <>
      <RedirectToTasks />
      <RequireOrganization />
    </>
  );
}
