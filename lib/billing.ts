export type PaidTier = "PRO" | "BUSINESS";
export type BillingIntervalValue = "MONTH" | "YEAR";

export const PLAN_ORDER: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  BUSINESS: 2,
};

export const PLAN_PRICING: Record<
  PaidTier,
  Record<BillingIntervalValue, number>
> = {
  PRO: { MONTH: 83000, YEAR: 830000 },
  BUSINESS: { MONTH: 660000, YEAR: 6600000 },
};

export const PLAN_META: Record<
  string,
  { name: string; blurb: string; accent: string }
> = {
  FREE: {
    name: "Free",
    blurb: "For a single person getting organised.",
    accent: "text-muted-foreground",
  },
  PRO: {
    name: "Pro",
    blurb: "For power users and small teams.",
    accent: "text-primary",
  },
  BUSINESS: {
    name: "Business",
    blurb: "For teams that work in the same room.",
    accent: "text-primary",
  },
};

export const formatPrice = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);

export const addBillingPeriod = (
  from: Date,
  interval: BillingIntervalValue
) => {
  const next = new Date(from);
  const day = next.getDate();
  next.setDate(1);
  if (interval === "YEAR") {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  const daysInTargetMonth = new Date(
    next.getFullYear(),
    next.getMonth() + 1,
    0
  ).getDate();
  next.setDate(Math.min(day, daysInTargetMonth));
  return next;
};

export const isPaidPlanActive = (user: {
  plan?: string | null;
  planExpiresAt?: string | Date | null;
}) => {
  if (!user.plan || user.plan === "FREE") return false;
  if (!user.planExpiresAt) return true;
  return new Date(user.planExpiresAt).getTime() > Date.now();
};

export const effectivePlan = (user: {
  plan?: string | null;
  planExpiresAt?: string | Date | null;
}) => (isPaidPlanActive(user) ? user.plan! : "FREE");

export const intervalLabel = (interval?: string | null) =>
  interval === "YEAR" ? "Yearly" : "Monthly";
