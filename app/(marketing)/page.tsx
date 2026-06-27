import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { MarketingHero } from "@/components/marketing/marketing-hero";

export const metadata = {
  title: "Zencom — Real-time customer messaging",
  description:
    "Embed a chat widget on your site, manage conversations in a shared inbox, and answer from your knowledge base with AI.",
};

export default async function MarketingHomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <>
      <MarketingHero />
      <FeatureGrid />
    </>
  );
}
