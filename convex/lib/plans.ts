export type PlanSlug = "org:free" | "org:pro" | "org:scale";

export type PlanQuotas = {
  aiMessagesPerMonth: number;
  kbDocuments: number;
  helpArticles: number | null;
};

export const PLAN_QUOTAS: Record<PlanSlug, PlanQuotas> = {
  "org:free": {
    aiMessagesPerMonth: 100,
    kbDocuments: 5,
    helpArticles: 10,
  },
  "org:pro": {
    aiMessagesPerMonth: 2000,
    kbDocuments: 50,
    helpArticles: null,
  },
  "org:scale": {
    aiMessagesPerMonth: 10000,
    kbDocuments: 500,
    helpArticles: null,
  },
};

export function normalizePlanSlug(slug: string | undefined): PlanSlug {
  if (slug === "org:pro" || slug === "org:scale") return slug;
  return "org:free";
}

export function getQuotasForPlan(slug: string | undefined): PlanQuotas {
  return PLAN_QUOTAS[normalizePlanSlug(slug)];
}
