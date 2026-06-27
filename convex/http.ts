import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

type ClerkWebhookEvent = {
  type: string;
  data: Record<string, unknown>;
};

function getOrgIdFromEvent(event: ClerkWebhookEvent): string | null {
  const data = event.data;
  if (typeof data.organization_id === "string") return data.organization_id;
  if (typeof data.id === "string" && event.type.startsWith("organization.")) {
    return data.id;
  }
  const org = data.organization as { id?: string } | undefined;
  return org?.id ?? null;
}

function getPlanSlugFromEvent(event: ClerkWebhookEvent): string {
  const data = event.data;
  const plan = data.plan as { slug?: string } | undefined;
  if (plan?.slug) return plan.slug;
  const items = data.items as Array<{ plan?: { slug?: string } }> | undefined;
  return items?.[0]?.plan?.slug ?? "org:free";
}

function getSeatCountFromEvent(event: ClerkWebhookEvent): number {
  const data = event.data;
  const seats = data.seats as number | undefined;
  if (typeof seats === "number") return seats;
  const item = data.subscription_item as { seats?: number } | undefined;
  if (typeof item?.seats === "number") return item.seats;
  return 1;
}

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!signingSecret) {
      return new Response("Missing CLERK_WEBHOOK_SIGNING_SECRET", { status: 500 });
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const body = await request.text();
    const wh = new Webhook(signingSecret);

    let event: ClerkWebhookEvent;
    try {
      event = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkWebhookEvent;
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }

    if (event.type === "organization.created") {
      const data = event.data as { id: string; name: string; slug: string };
      await ctx.runMutation(internal.webhooks.clerkOrganizations.provisionFromClerkOrg, {
        clerkOrgId: data.id,
        name: data.name,
        slug: data.slug,
      });
    }

    const billingEvents = [
      "subscription.created",
      "subscription.updated",
      "subscriptionItem.updated",
      "organizationMembership.created",
      "organizationMembership.deleted",
    ];

    if (billingEvents.includes(event.type)) {
      const clerkOrgId = getOrgIdFromEvent(event);
      if (clerkOrgId) {
        await ctx.runMutation(internal.webhooks.clerkBilling.syncSubscription, {
          clerkOrgId,
          planSlug: getPlanSlugFromEvent(event),
          seatCount: getSeatCountFromEvent(event),
        });
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
