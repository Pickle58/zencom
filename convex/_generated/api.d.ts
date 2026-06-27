/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents from "../agents.js";
import type * as ai from "../ai.js";
import type * as aiActions from "../aiActions.js";
import type * as aiControl from "../aiControl.js";
import type * as aiInternals from "../aiInternals.js";
import type * as billing from "../billing.js";
import type * as conversations from "../conversations.js";
import type * as helpCenter from "../helpCenter.js";
import type * as http from "../http.js";
import type * as kbArticles from "../kbArticles.js";
import type * as kbDocumentActions from "../kbDocumentActions.js";
import type * as kbDocumentInternals from "../kbDocumentInternals.js";
import type * as kbDocuments from "../kbDocuments.js";
import type * as kbDocumentsActions from "../kbDocumentsActions.js";
import type * as leads from "../leads.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_embedKey from "../lib/embedKey.js";
import type * as lib_plans from "../lib/plans.js";
import type * as lib_usage from "../lib/usage.js";
import type * as messages from "../messages.js";
import type * as presence from "../presence.js";
import type * as sessionAuth from "../sessionAuth.js";
import type * as visitors from "../visitors.js";
import type * as webhooks_clerkBilling from "../webhooks/clerkBilling.js";
import type * as webhooks_clerkOrganizations from "../webhooks/clerkOrganizations.js";
import type * as widgetAi from "../widgetAi.js";
import type * as widgetSettings from "../widgetSettings.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agents: typeof agents;
  ai: typeof ai;
  aiActions: typeof aiActions;
  aiControl: typeof aiControl;
  aiInternals: typeof aiInternals;
  billing: typeof billing;
  conversations: typeof conversations;
  helpCenter: typeof helpCenter;
  http: typeof http;
  kbArticles: typeof kbArticles;
  kbDocumentActions: typeof kbDocumentActions;
  kbDocumentInternals: typeof kbDocumentInternals;
  kbDocuments: typeof kbDocuments;
  kbDocumentsActions: typeof kbDocumentsActions;
  leads: typeof leads;
  "lib/auth": typeof lib_auth;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/embedKey": typeof lib_embedKey;
  "lib/plans": typeof lib_plans;
  "lib/usage": typeof lib_usage;
  messages: typeof messages;
  presence: typeof presence;
  sessionAuth: typeof sessionAuth;
  visitors: typeof visitors;
  "webhooks/clerkBilling": typeof webhooks_clerkBilling;
  "webhooks/clerkOrganizations": typeof webhooks_clerkOrganizations;
  widgetAi: typeof widgetAi;
  widgetSettings: typeof widgetSettings;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
