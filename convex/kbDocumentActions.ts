"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

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
