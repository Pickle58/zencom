"use client";

import { OrganizationProfile } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingPage() {
  const subscription = useQuery(api.billing.getSubscription, {});
  const usage = useQuery(api.billing.getUsage, {});

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-muted-foreground text-sm">Manage your organization plan and usage.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current plan</CardTitle>
          </CardHeader>
          <CardContent>
            {subscription === undefined ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className="text-lg font-medium">{subscription.planSlug}</p>
            )}
            {subscription ? (
              <p className="text-muted-foreground text-sm">{subscription.seatCount} seats</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage this month</CardTitle>
          </CardHeader>
          <CardContent>
            {usage === undefined ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <div className="space-y-1 text-sm">
                <p>
                  AI messages: {usage.aiMessages} / {usage.quotas.aiMessagesPerMonth}
                </p>
                <p>
                  KB documents: {usage.kbDocuments} / {usage.quotas.kbDocuments}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <OrganizationProfile routing="hash" />
    </div>
  );
}
