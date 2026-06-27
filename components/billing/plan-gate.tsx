"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PlanGateProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

function DefaultUpgradeFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upgrade to Pro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">
          This feature is available on Pro and Scale plans.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/billing" />}
        >
          View billing
        </Button>
      </CardContent>
    </Card>
  );
}

export function PlanGate({ children, fallback }: PlanGateProps) {
  return (
    <Show
      when={(has) => has({ plan: "org:pro" }) || has({ plan: "org:scale" })}
      fallback={fallback ?? <DefaultUpgradeFallback />}
    >
      {children}
    </Show>
  );
}
