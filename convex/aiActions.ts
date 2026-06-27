"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, type ActionCtx } from "./_generated/server";

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

type Citation = {
  documentId: Id<"kbDocuments">;
  title: string;
  excerpt: string;
};

type AnswerResult = {
  answer: string;
  citations: Citation[];
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

    const citations = await ctx.runAction(internal.kbDocumentActions.searchKb, {
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

export const streamGenerateAnswer = internalAction({
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

    const citations = await ctx.runAction(internal.kbDocumentActions.searchKb, {
      workspaceId: context.workspaceId,
      query: args.query,
    });

    if (!args.conversationId) {
      const answer = await generateWithLlm(args.query, citations);
      return { answer, citations };
    }

    const messageId: Id<"messages"> = await ctx.runMutation(
      internal.aiInternals.createStreamingAiMessage,
      {
        conversationId: args.conversationId,
        workspaceId: context.workspaceId,
      },
    );

    try {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        const answer = fallbackAnswer(citations);
        await ctx.runMutation(internal.aiInternals.appendAiMessageBody, {
          messageId,
          delta: answer,
        });
        await ctx.runMutation(internal.aiInternals.finalizeAiMessage, {
          messageId,
          citations,
        });
        return { answer, citations };
      }

      const answer = await streamWithLlm(ctx, messageId, args.query, citations);
      await ctx.runMutation(internal.aiInternals.finalizeAiMessage, {
        messageId,
        citations,
      });
      return { answer, citations };
    } catch (error) {
      const errorBody =
        error instanceof Error ? error.message : "Sorry, I could not generate an answer.";
      await ctx.runMutation(internal.aiInternals.failAiMessage, {
        messageId,
        errorBody,
      });
      throw error;
    }
  },
});

export const autoReplyFromVisitor = internalAction({
  args: {
    embedKey: v.string(),
    conversationId: v.id("conversations"),
    visitorMessageBody: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.visitorMessageBody.startsWith("/ai ")) {
      return null;
    }

    const workspace = await ctx.runQuery(internal.aiInternals.getWorkspaceForEmbedKey, {
      embedKey: args.embedKey,
    });
    if (!workspace || !workspace.aiEnabled || !workspace.aiAutoReply) {
      return null;
    }

    const conversation = await ctx.runQuery(internal.aiInternals.getConversation, {
      conversationId: args.conversationId,
    });
    if (!conversation || conversation.aiPaused) {
      return null;
    }

    await ctx.runAction(internal.aiActions.streamGenerateAnswer, {
      query: args.visitorMessageBody,
      orgId: "",
      conversationId: args.conversationId,
      embedKey: args.embedKey,
    });

    return null;
  },
});

function fallbackAnswer(citations: Citation[]): string {
  if (citations.length === 0) {
    return "I don't have enough knowledge base content to answer that yet.";
  }
  return `Based on our knowledge base:\n\n${citations[0]?.excerpt ?? ""}`;
}

async function generateWithLlm(
  query: string,
  citations: Array<{ title: string; excerpt: string }>,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const contextBlock = citations
    .map((c, i) => `[${i + 1}] ${c.title}: ${c.excerpt}`)
    .join("\n");

  if (!apiKey) {
    return fallbackAnswer(citations as Citation[]);
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

const LLM_STREAM_IDLE_TIMEOUT_MS = 60_000;

async function streamWithLlm(
  ctx: ActionCtx,
  messageId: Id<"messages">,
  query: string,
  citations: Array<{ title: string; excerpt: string }>,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackAnswer(citations as Citation[]);
  }

  const contextBlock = citations
    .map((c, i) => `[${i + 1}] ${c.title}: ${c.excerpt}`)
    .join("\n");

  const abortController = new AbortController();
  let idleTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

  const clearIdleTimeout = () => {
    if (idleTimeoutId !== undefined) {
      clearTimeout(idleTimeoutId);
      idleTimeoutId = undefined;
    }
  };

  const resetIdleTimeout = () => {
    clearIdleTimeout();
    idleTimeoutId = setTimeout(() => {
      void reader?.cancel().catch(() => undefined);
      abortController.abort();
    }, LLM_STREAM_IDLE_TIMEOUT_MS);
  };

  try {
    resetIdleTimeout();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: abortController.signal,
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
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.status}`);
    }

    reader = response.body?.getReader();
    if (!reader) {
      throw new Error("LLM response had no body");
    }

    const decoder = new TextDecoder();
    let fullAnswer = "";
    let buffer = "";

    while (true) {
      let done: boolean;
      let value: Uint8Array | undefined;
      try {
        ({ done, value } = await reader.read());
      } catch (error) {
        if (abortController.signal.aborted) {
          throw new Error("LLM stream timed out");
        }
        throw error;
      }

      if (done) break;

      resetIdleTimeout();

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data) as {
            choices: Array<{ delta: { content?: string } }>;
          };
          const delta = parsed.choices[0]?.delta?.content ?? "";
          if (!delta) continue;

          fullAnswer += delta;
          await ctx.runMutation(internal.aiInternals.appendAiMessageBody, {
            messageId,
            delta,
          });
        } catch {
          // Skip malformed SSE chunks.
        }
      }
    }

    const emptyAnswerFallback = "Sorry, I could not generate an answer.";
    if (!fullAnswer) {
      await ctx.runMutation(internal.aiInternals.appendAiMessageBody, {
        messageId,
        delta: emptyAnswerFallback,
      });
      return emptyAnswerFallback;
    }

    return fullAnswer;
  } catch (error) {
    if (abortController.signal.aborted) {
      throw new Error("LLM stream timed out");
    }
    throw error;
  } finally {
    clearIdleTimeout();
    void reader?.cancel().catch(() => undefined);
  }
}
