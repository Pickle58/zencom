import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { MarkdownBody } from "@/components/markdown/markdown-body";
import { api } from "@/convex/_generated/api";

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string; articleSlug: string }>;
}) {
  const { slug, articleSlug } = await params;
  const article = await fetchQuery(api.helpCenter.getPublishedArticle, {
    workspaceSlug: slug,
    articleSlug,
  });

  if (!article) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="text-muted-foreground">Article not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <Link href={`/help/${slug}`} className="text-muted-foreground text-sm underline">
        ← Back to help center
      </Link>
      <article>
        <h1 className="mb-6 text-3xl font-semibold">{article.title}</h1>
        <MarkdownBody content={article.bodyMarkdown} />
      </article>
    </main>
  );
}
