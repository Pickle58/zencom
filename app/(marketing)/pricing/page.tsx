import { PricingTable } from "@clerk/nextjs";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16">
        <div className="mb-10 space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Simple per-seat pricing</h1>
          <p className="text-muted-foreground">
            Free, Pro, and Scale plans with included seats and usage quotas for AI and KB.
          </p>
        </div>
        <PricingTable for="organization" />
        <div className="text-muted-foreground mt-12 space-y-3 text-sm">
          <p>
            <strong>Free</strong> — 2 seats, 100 AI messages/mo, 5 KB documents, 10 help articles.
          </p>
          <p>
            <strong>Pro</strong> — $49/mo, 3 included seats + $12/seat, up to 20 seats.
          </p>
          <p>
            <strong>Scale</strong> — $149/mo, 10 included seats + $8/seat, up to 100 seats.
          </p>
        </div>
      </main>
    </div>
  );
}
