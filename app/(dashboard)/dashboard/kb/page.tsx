"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function KbPage() {
  const categories = useQuery(api.kbArticles.listCategories, {});
  const articles = useQuery(api.kbArticles.listArticles, {});
  const documents = useQuery(api.kbDocuments.list, {});
  const upsertArticle = useMutation(api.kbArticles.upsertArticle);
  const ingestText = useMutation(api.kbDocuments.ingestText);
  const askFromDashboard = useAction(api.ai.askFromDashboard);

  const [ragQuery, setRagQuery] = useState("");
  const [ragAnswer, setRagAnswer] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");

  async function handleSaveArticle() {
    await upsertArticle({
      title,
      bodyMarkdown: body,
      published: true,
      popular: false,
    });
    setTitle("");
    setBody("");
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
    const result = await askFromDashboard({ query: ragQuery });
    setRagAnswer(result.answer);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Knowledge base</h1>
        <p className="text-muted-foreground text-sm">
          Help articles, document ingestion, and RAG testing.
        </p>
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
              <CardTitle className="text-base">New article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
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
            {(articles ?? []).map((article: Doc<"kbArticles">) => (
              <div key={article._id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{article.title}</p>
                <p className="text-muted-foreground">/{article.slug}</p>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Categories: {(categories ?? []).map((c: Doc<"kbCategories">) => c.name).join(", ") || "None yet"}
          </p>
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
              <div key={doc._id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{doc.title}</p>
                <p className="text-muted-foreground">
                  {doc.status} · {doc.chunkCount} chunks
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rag" className="space-y-4">
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
              <Button onClick={() => void handleRagTest()} disabled={!ragQuery.trim()}>
                Query KB
              </Button>
              {ragAnswer ? (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                  {ragAnswer}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
