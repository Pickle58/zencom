import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const subscriptionStatusValidator = v.union(
  v.literal("active"),
  v.literal("canceled"),
  v.literal("past_due"),
  v.literal("trialing"),
  v.literal("incomplete"),
);

export const subscriptionSnapshotValidator = v.object({
  planSlug: v.string(),
  seatCount: v.number(),
  updatedAt: v.number(),
  status: v.optional(subscriptionStatusValidator),
});

export const widgetSettingsValidator = v.object({
  primaryColor: v.string(),
  position: v.union(v.literal("bottom-right"), v.literal("bottom-left")),
  title: v.string(),
  borderRadius: v.optional(v.number()),
  marginBottom: v.optional(v.number()),
  marginSide: v.optional(v.number()),
  logoUrl: v.optional(v.string()),
  soundEnabled: v.optional(v.boolean()),
  proactiveEnabled: v.optional(v.boolean()),
  proactiveDelayMs: v.optional(v.number()),
  proactiveMessage: v.optional(v.string()),
  leadCaptureEnabled: v.optional(v.boolean()),
  leadCaptureRequired: v.optional(v.boolean()),
  faqShortcuts: v.optional(v.array(v.string())),
  aiEnabled: v.optional(v.boolean()),
  aiAutoReply: v.optional(v.boolean()),
});

export const streamStatusValidator = v.union(
  v.literal("streaming"),
  v.literal("complete"),
  v.literal("failed"),
);

export const conversationStatusValidator = v.union(
  v.literal("open"),
  v.literal("closed"),
);

export const authorTypeValidator = v.union(
  v.literal("visitor"),
  v.literal("agent"),
  v.literal("system"),
  v.literal("ai"),
);

export const leadStatusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("closed"),
);

export const kbDocumentStatusValidator = v.union(
  v.literal("processing"),
  v.literal("ready"),
  v.literal("failed"),
);

export default defineSchema({
  workspaces: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.string(),
    embedKeyHash: v.string(),
    embedKeyPrefix: v.string(),
    widgetSettings: widgetSettingsValidator,
    subscriptionSnapshot: v.optional(subscriptionSnapshotValidator),
    createdAt: v.number(),
  })
    .index("by_clerkOrgId", ["clerkOrgId"])
    .index("by_embedKeyPrefix", ["embedKeyPrefix"])
    .index("by_slug", ["slug"]),

  visitors: defineTable({
    workspaceId: v.id("workspaces"),
    sessionToken: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
    lastSeenAt: v.number(),
  }).index("by_workspace_session", ["workspaceId", "sessionToken"]),

  conversations: defineTable({
    workspaceId: v.id("workspaces"),
    visitorId: v.id("visitors"),
    status: conversationStatusValidator,
    assignedToClerkUserId: v.optional(v.string()),
    lastMessageAt: v.number(),
    unreadByAgent: v.boolean(),
    aiPaused: v.optional(v.boolean()),
    agentThreadId: v.optional(v.string()),
    visitorTypingAt: v.optional(v.number()),
    agentTypingAt: v.optional(v.number()),
    agentTypingClerkUserId: v.optional(v.string()),
  })
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_workspace_lastMessage", ["workspaceId", "lastMessageAt"])
    .index("by_workspace_assigned", ["workspaceId", "assignedToClerkUserId"])
    .index("by_workspace_visitor_status", [
      "workspaceId",
      "visitorId",
      "status",
    ]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    workspaceId: v.id("workspaces"),
    authorType: authorTypeValidator,
    authorClerkUserId: v.optional(v.string()),
    body: v.string(),
    createdAt: v.number(),
    citations: v.optional(
      v.array(
        v.object({
          documentId: v.id("kbDocuments"),
          title: v.string(),
          excerpt: v.string(),
        }),
      ),
    ),
    streamStatus: v.optional(streamStatusValidator),
  }).index("by_conversation", ["conversationId", "createdAt"]),

  conversationPresence: defineTable({
    workspaceId: v.id("workspaces"),
    conversationId: v.id("conversations"),
    clerkUserId: v.string(),
    lastSeenAt: v.number(),
  })
    .index("by_conversation", ["conversationId", "lastSeenAt"])
    .index("by_conversation_user", ["conversationId", "clerkUserId"]),

  kbCategories: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    slug: v.string(),
    sortOrder: v.number(),
  }).index("by_workspace_slug", ["workspaceId", "slug"]),

  kbArticles: defineTable({
    workspaceId: v.id("workspaces"),
    categoryId: v.optional(v.id("kbCategories")),
    title: v.string(),
    slug: v.string(),
    bodyMarkdown: v.string(),
    coverImageUrl: v.optional(v.string()),
    published: v.boolean(),
    popular: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_workspace_slug", ["workspaceId", "slug"])
    .index("by_workspace_published", ["workspaceId", "published"]),

  kbDocuments: defineTable({
    workspaceId: v.id("workspaces"),
    title: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    status: kbDocumentStatusValidator,
    errorMessage: v.optional(v.string()),
    chunkCount: v.number(),
    createdAt: v.number(),
  }).index("by_workspace", ["workspaceId", "createdAt"]),

  kbChunks: defineTable({
    workspaceId: v.id("workspaces"),
    documentId: v.id("kbDocuments"),
    chunkIndex: v.number(),
    text: v.string(),
    embedding: v.array(v.float64()),
  })
    .index("by_document", ["documentId", "chunkIndex"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["workspaceId"],
    }),

  leads: defineTable({
    workspaceId: v.id("workspaces"),
    visitorId: v.optional(v.id("visitors")),
    conversationId: v.optional(v.id("conversations")),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.string(),
    status: leadStatusValidator,
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_workspace_created", ["workspaceId", "createdAt"]),

  usageCounters: defineTable({
    workspaceId: v.id("workspaces"),
    monthKey: v.string(),
    aiMessages: v.number(),
    kbDocuments: v.number(),
  }).index("by_workspace_month", ["workspaceId", "monthKey"]),
});
