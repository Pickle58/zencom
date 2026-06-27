"use client";

import Link from "next/link";
import { OrganizationProfile, Show } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UsageMeter } from "@/components/billing/usage-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active" || status === "trialing") return "default";
  if (status === "canceled" || status === "past_due" || status === "incomplete") {
    return "destructive";
  }
  return "outline";
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export default function BillingPage() {
  const planDetails = useQuery(api.billing.getPlanDetails, {});
  const usage = useQuery(api.billing.getUsage, {});

  const isLoading = planDetails === undefined || usage === undefined;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-muted-foreground text-sm">
            Manage your organization plan and usage.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/pricing" />}
        >
          Compare plans
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-medium">{planDetails.planLabel}</p>
                  {planDetails.status ? (
                    <Badge variant={statusBadgeVariant(planDetails.status)}>
                      {formatStatus(planDetails.status)}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-sm">{planDetails.planSlug}</p>
                <p className="text-muted-foreground text-sm">
                  {planDetails.seatCount} {planDetails.seatCount === 1 ? "seat" : "seats"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage this month</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <UsageMeter
                  label="AI messages"
                  used={usage.aiMessages}
                  limit={usage.quotas.aiMessagesPerMonth}
                />
                <UsageMeter
                  label="KB documents"
                  used={usage.kbDocuments}
                  limit={usage.quotas.kbDocuments}
                />
                <UsageMeter
                  label="Help articles"
                  used={usage.helpArticles}
                  limit={usage.quotas.helpArticles}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Show
        when={(has) =>
          has({ role: "org:admin" }) || has({ permission: "org:sys_billing:manage" })
        }
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">
                Contact your organization admin to manage billing.
              </p>
            </CardContent>
          </Card>
        }
      >
        <OrganizationProfile routing="hash" />
      </Show>
    </div>
  );
}
