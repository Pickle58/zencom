"use client";

import { useState } from "react";
import { Show } from "@clerk/nextjs";
import { ExternalLink } from "lucide-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type RagCitation = {
  documentId: Id<"kbDocuments">;
  title: string;
  excerpt: string;
};

type RagResult = {
  answer: string;
  citations: RagCitation[];
};

const NO_CATEGORY = "__none__";

export default function KbPage() {
  const workspace = useQuery(api.workspaces.getCurrent, {});
  const categories = useQuery(api.kbArticles.listCategories, {});
  const articles = useQuery(api.kbArticles.listArticles, {});
  const documents = useQuery(api.kbDocuments.list, {});
  const createCategory = useMutation(api.kbArticles.createCategory);
  const upsertArticle = useMutation(api.kbArticles.upsertArticle);
  const deleteArticle = useMutation(api.kbArticles.deleteArticle);
  const ingestText = useMutation(api.kbDocuments.ingestText);
  const deleteDocument = useMutation(api.kbDocuments.deleteDocument);
  const askFromDashboard = useAction(api.ai.askFromDashboard);

  const [categoryName, setCategoryName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState<string>(NO_CATEGORY);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [ragQuery, setRagQuery] = useState("");
  const [ragLoading, setRagLoading] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const [ragResult, setRagResult] = useState<RagResult | null>(null);

  async function handleCreateCategory() {
    const name = categoryName.trim();
    if (!name) return;
    await createCategory({ name });
    setCategoryName("");
  }

  async function handleSaveArticle() {
    await upsertArticle({
      title,
      bodyMarkdown: body,
      published: true,
      popular: false,
      categoryId:
        categoryId === NO_CATEGORY ? undefined : (categoryId as Id<"kbCategories">),
    });
    setTitle("");
    setBody("");
    setCategoryId(NO_CATEGORY);
  }

  async function handleIngestDoc() {
    await ingestText({
      title: docTitle,
      fileName: `${docTitle}.txt`,
      mimeType: "text/plain",
      content: docContent,
    });
    setDocTitle("");
    setDocContent("");
  }

  async function handleRagTest() {
    setRagLoading(true);
    setRagError(null);
    setRagResult(null);
    try {
      const result = await askFromDashboard({ query: ragQuery });
      setRagResult(result);
    } catch (error) {
      setRagError(error instanceof Error ? error.message : "Query failed");
    } finally {
      setRagLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Knowledge base</h1>
          <p className="text-muted-foreground text-sm">
            Help articles, document ingestion, and RAG testing.
          </p>
        </div>
        {workspace ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a
                href={`/help/${workspace.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Open help center
            <ExternalLink className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Articles ({articles?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="rag">RAG test</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
                <Button
                  onClick={() => void handleCreateCategory()}
                  disabled={!categoryName.trim()}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(categories ?? []).map((category: Doc<"kbCategories">) => (
                  <Badge key={category._id} variant="secondary">
                    {category.name}
                  </Badge>
                ))}
                {categories?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No categories yet.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">New article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Category (optional)</Label>
                <Select
                  value={categoryId}
                  onValueChange={(value) => setCategoryId(value ?? NO_CATEGORY)}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                    {(categories ?? []).map((category: Doc<"kbCategories">) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="body">Markdown body</Label>
                <Textarea id="body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
              <Button onClick={() => void handleSaveArticle()} disabled={!title.trim()}>
                Publish article
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {(articles ?? []).map((article: Doc<"kbArticles">) => {
              const category = (categories ?? []).find(
                (c: Doc<"kbCategories">) => c._id === article.categoryId,
              );
              return (
                <div
                  key={article._id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{article.title}</p>
                      <Badge variant={article.published ? "default" : "outline"}>
                        {article.published ? "Published" : "Draft"}
                      </Badge>
                      {category ? (
                        <Badge variant="secondary">{category.name}</Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground">/{article.slug}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void deleteArticle({ articleId: article._id })}
                  >
                    Delete
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload text document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Title" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
              <Textarea
                placeholder="Paste .md or .txt content"
                rows={8}
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
              />
              <Button onClick={() => void handleIngestDoc()} disabled={!docTitle || !docContent}>
                Ingest & embed
              </Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {(documents ?? []).map((doc: Doc<"kbDocuments">) => (
              <div
                key={doc._id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-muted-foreground">
                    <Badge
                      variant={
                        doc.status === "ready"
                          ? "default"
                          : doc.status === "failed"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {doc.status}
                    </Badge>
                    {" · "}
                    {doc.chunkCount} chunks
                  </p>
                  {doc.status === "failed" && doc.errorMessage ? (
                    <p className="text-destructive text-xs">{doc.errorMessage}</p>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void deleteDocument({ documentId: doc._id })}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rag" className="space-y-4">
          <Show
            when={(has) => !has({ plan: "org:pro" }) && !has({ plan: "org:scale" })}
          >
            <p className="text-muted-foreground rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              Free plan includes 100 AI messages/month. Upgrade for more.
            </p>
          </Show>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test retrieval + answer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Ask a question..."
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
              />
              <Button
                onClick={() => void handleRagTest()}
                disabled={!ragQuery.trim() || ragLoading}
              >
                {ragLoading ? "Querying…" : "Query KB"}
              </Button>
              {ragError ? (
                <p className="text-destructive text-sm">{ragError}</p>
              ) : null}
              {ragResult ? (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                    {ragResult.answer}
                  </div>
                  {ragResult.citations.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Citations</p>
                      <ol className="space-y-2 text-sm">
                        {ragResult.citations.map((citation, index) => (
                          <li key={`${citation.documentId}-${index}`} className="rounded-lg border p-3">
                            <p className="font-medium">
                              {index + 1}. {citation.title}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">{citation.excerpt}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
