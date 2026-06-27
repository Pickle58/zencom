"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const CHUNK_SIZE = 800;

function splitText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + CHUNK_SIZE).trim());
    start += CHUNK_SIZE;
  }
  return chunks.filter(Boolean);
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return texts.map(() => Array.from({ length: 1536 }, () => 0));
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };
  return json.data.map((row) => row.embedding);
}

export async function embedSingleText(text: string): Promise<number[]> {
  const embeddings = await embedTexts([text]);
  return embeddings[0] ?? Array.from({ length: 1536 }, () => 0);
}

const kbSearchResultValidator = v.array(
  v.object({
    documentId: v.id("kbDocuments"),
    title: v.string(),
    excerpt: v.string(),
  }),
);

type KbSearchResult = Array<{
  documentId: Id<"kbDocuments">;
  title: string;
  excerpt: string;
}>;

function isZeroVector(embedding: number[]): boolean {
  return embedding.every((value) => value === 0);
}

export const searchKb = internalAction({
  args: {
    workspaceId: v.id("workspaces"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: kbSearchResultValidator,
  handler: async (ctx, args): Promise<KbSearchResult> => {
    const queryText = args.query.trim();
    if (!queryText) return [];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return await ctx.runQuery(internal.aiInternals.searchKbSubstring, {
        workspaceId: args.workspaceId,
        query: queryText,
        limit: args.limit,
      });
    }

    const embedding = await embedSingleText(queryText);
    if (isZeroVector(embedding)) {
      return await ctx.runQuery(internal.aiInternals.searchKbSubstring, {
        workspaceId: args.workspaceId,
        query: queryText,
        limit: args.limit,
      });
    }

    const limit = args.limit ?? 5;
    const searchResults = await ctx.vectorSearch("kbChunks", "by_embedding", {
      vector: embedding,
      limit: limit * 3,
      filter: (q) => q.eq("workspaceId", args.workspaceId),
    });

    return await ctx.runQuery(internal.aiInternals.vectorSearchKb, {
      workspaceId: args.workspaceId,
      chunkIds: searchResults.map((result) => result._id),
      limit,
    });
  },
});

export const processDocument = internalAction({
  args: {
    documentId: v.id("kbDocuments"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const chunks = splitText(args.content);
      const embeddings = await embedTexts(chunks);

      await ctx.runMutation(internal.kbDocumentInternals.storeChunks, {
        documentId: args.documentId,
        chunks: chunks.map((text, index) => ({
          chunkIndex: index,
          text,
          embedding: embeddings[index] ?? [],
        })),
      });
    } catch (error) {
      await ctx.runMutation(internal.kbDocumentInternals.markFailed, {
        documentId: args.documentId,
        errorMessage: error instanceof Error ? error.message : "Processing failed",
      });
    }
    return null;
  },
});
