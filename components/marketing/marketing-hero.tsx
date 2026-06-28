import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MarketingHeroProps = {
  title?: string;
  description?: string;
};

export function MarketingHero({
  title = "Support your customers in real time",
  description = "Embed a chat widget on your site, manage conversations in a shared inbox, and answer from your knowledge base with AI — built for teams on Clerk organizations.",
}: MarketingHeroProps) {
  const defaultTitle = "Support your customers in real time";

  return (
    <section className="flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-primary/5 via-background to-accent/20 px-4 py-24 text-center">
      <div className="max-w-3xl space-y-4">
        <p className="text-accent-foreground text-sm font-medium tracking-wide uppercase">
          B2B customer messaging
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {title === defaultTitle ? (
            <>
              Support your customers{" "}
              <span className="bg-gradient-to-r from-primary to-[oklch(0.5_0.22_285)] bg-clip-text text-transparent">
                in real time
              </span>
            </>
          ) : (
            title
          )}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }))}>
          Start free
        </Link>
        <Link href="/pricing" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          View pricing
        </Link>
        <Link href="/docs/install" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Install guide
        </Link>
      </div>
    </section>
  );
}
