"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const answerReturnValidator = v.object({
  answer: v.string(),
  citations: v.array(
    v.object({
      documentId: v.id("kbDocuments"),
      title: v.string(),
      excerpt: v.string(),
    }),
  ),
});

type AnswerResult = {
  answer: string;
  citations: Array<{
    documentId: import("./_generated/dataModel").Id<"kbDocuments">;
    title: string;
    excerpt: string;
  }>;
};

export const generateAnswer = internalAction({
  args: {
    query: v.string(),
    orgId: v.string(),
    workspaceId: v.optional(v.id("workspaces")),
    conversationId: v.optional(v.id("conversations")),
    embedKey: v.optional(v.string()),
    skipAiPausedCheck: v.optional(v.boolean()),
  },
  returns: answerReturnValidator,
  handler: async (ctx, args): Promise<AnswerResult> => {
    if (args.conversationId && !args.skipAiPausedCheck) {
      const conversation = await ctx.runQuery(internal.aiInternals.getConversation, {
        conversationId: args.conversationId,
      });
      if (conversation?.aiPaused) {
        return { answer: "", citations: [] };
      }
    }

    const context = await ctx.runQuery(internal.aiInternals.resolveContext, {
      orgId: args.orgId,
      workspaceId: args.workspaceId,
      embedKey: args.embedKey,
    });

    if (!context) {
      throw new Error("Workspace not found");
    }

    await ctx.runMutation(internal.aiInternals.assertAndIncrementAiUsage, {
      workspaceId: context.workspaceId,
    });

    const citations = await ctx.runQuery(internal.aiInternals.searchKb, {
      workspaceId: context.workspaceId,
      query: args.query,
    });

    const answer = await generateWithLlm(args.query, citations);

    if (args.conversationId) {
      await ctx.runMutation(internal.aiInternals.saveAiMessage, {
        conversationId: args.conversationId,
        workspaceId: context.workspaceId,
        body: answer,
        citations,
      });
    }

    return { answer, citations };
  },
});

async function generateWithLlm(
  query: string,
  citations: Array<{ title: string; excerpt: string }>,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const contextBlock = citations
    .map((c, i) => `[${i + 1}] ${c.title}: ${c.excerpt}`)
    .join("\n");

  if (!apiKey) {
    if (citations.length === 0) {
      return "I don't have enough knowledge base content to answer that yet.";
    }
    return `Based on our knowledge base:\n\n${citations[0]?.excerpt ?? ""}`;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful support assistant. Answer using the provided context. Cite sources by number when relevant.",
        },
        {
          role: "user",
          content: `Question: ${query}\n\nContext:\n${contextBlock || "No context found."}`,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return json.choices[0]?.message.content ?? "Sorry, I could not generate an answer.";
}
