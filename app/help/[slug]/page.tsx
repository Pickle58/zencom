import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

export default async function HelpCenterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workspace = await fetchQuery(api.helpCenter.getWorkspaceBySlug, {
    workspaceSlug: slug,
  });
  const articles = await fetchQuery(api.helpCenter.listPublishedByWorkspaceSlug, {
    workspaceSlug: slug,
  });

  if (!workspace) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="text-muted-foreground">Help center not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-semibold">{workspace.name} Help</h1>
        <p className="text-muted-foreground mt-1 text-sm">Browse published articles</p>
      </div>
      <ul className="divide-y rounded-xl border">
        {(articles as Doc<"kbArticles">[]).map((article) => (
          <li key={article._id}>
            <Link
              href={`/help/${slug}/${article.slug}`}
              className="hover:bg-muted/50 block px-4 py-3"
            >
              <p className="font-medium">{article.title}</p>
              {article.popular ? (
                <span className="text-primary text-xs">Popular</span>
              ) : null}
            </Link>
          </li>
        ))}
        {articles.length === 0 ? (
          <li className="text-muted-foreground px-4 py-6 text-sm">No articles yet.</li>
        ) : null}
      </ul>
    </main>
  );
}
