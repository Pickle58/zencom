"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { InboxView } from "@/components/inbox/inbox-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function InboxPage() {
  return (
    <>
      <AuthLoading>
        <Skeleton className="h-[calc(100vh-8rem)] w-full" />
      </AuthLoading>
      <Unauthenticated>
        <p>Please sign in.</p>
      </Unauthenticated>
      <Authenticated>
        <InboxView />
      </Authenticated>
    </>
  );
}
