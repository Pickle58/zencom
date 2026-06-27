import Link from "next/link";
import { PricingTable } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Pricing — Zencom",
  description:
    "Simple per-seat pricing with Free, Pro, and Scale plans. Included seats and usage quotas for AI and knowledge base.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <div className="mb-10 space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Simple per-seat pricing</h1>
        <p className="text-muted-foreground">
          Free, Pro, and Scale plans with included seats and usage quotas for AI and KB.
        </p>
      </div>
      <PricingTable for="organization" />
      <div className="mt-10 flex justify-center">
        <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }))}>
          Start free
        </Link>
      </div>
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
    </div>
  );
}
