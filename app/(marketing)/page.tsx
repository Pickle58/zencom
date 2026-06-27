import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function MarketingHomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center">
        <div className="max-w-3xl space-y-4">
          <p className="text-primary text-sm font-medium tracking-wide uppercase">
            B2B customer messaging
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Support your customers in real time
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Embed a chat widget on your site, manage conversations in a shared inbox,
            and answer from your knowledge base with AI — built for teams on Clerk
            organizations.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }))}>
            Start free
          </Link>
          <Link href="/pricing" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            View pricing
          </Link>
        </div>
        <div className="grid w-full max-w-4xl gap-4 pt-8 sm:grid-cols-3">
          {[
            { title: "Live inbox", body: "Real-time conversations with filters and assignment." },
            { title: "Embeddable widget", body: "One-line install with secure embed keys." },
            { title: "KB + AI", body: "Upload docs, publish help articles, and assist visitors." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border bg-card p-5 text-left">
              <h2 className="font-medium">{item.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{item.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
