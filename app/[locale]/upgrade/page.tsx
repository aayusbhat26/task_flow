"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  Crown,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  formatPrice,
  intervalLabel,
  PLAN_META,
  PLAN_ORDER,
  PLAN_PRICING,
  effectivePlan,
  type BillingIntervalValue,
} from "@/lib/billing";
import { cn } from "@/lib/utils";

type BillingSummary = {
  plan: string;
  billingInterval: string | null;
  planStartedAt: string | null;
  planExpiresAt: string | null;
  provider: "RAZORPAY" | "INTERNAL" | null;
  testMode: boolean;
  orders: {
    id: string;
    tier: string;
    interval: string;
    amount: number;
    currency: string;
    status: string;
    receipt: string;
    createdAt: string;
    paidAt: string | null;
  }[];
};

const features: Record<string, string[]> = {
  FREE: [
    "Tasks, notes and mind maps",
    "Calendar and focus timer",
    "Paper and Evening themes",
    "3 mind maps",
    "Workspace chat",
  ],
  PRO: [
    "Everything in Free",
    "Every Pro palette",
    "8 mind maps",
    "Plan badge on your profile",
    "Priority support",
  ],
  BUSINESS: [
    "Everything in Pro",
    "Unlimited mind maps",
    "Plan badge on your profile",
    "Priority support",
    "Early access to new tools",
  ],
};

const descriptions: Record<string, string> = {
  FREE: "For a single person getting organised.",
  PRO: "For power users and small teams.",
  BUSINESS: "For teams that work in the same room.",
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export default function UpgradePage() {
  const [starting, setStarting] = useState<string | null>(null);
  const [interval, setBillingInterval] = useState<BillingIntervalValue>("MONTH");
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();

  const currentPlan = summary?.plan ?? effectivePlan({
    plan: session?.user?.plan,
    planExpiresAt: session?.user?.planExpiresAt,
  });
  const isPaid = currentPlan !== "FREE";
  const checkoutUnavailable =
    Boolean(session) && !summaryLoading && summary?.provider === null;

  const loadSummary = useCallback(async () => {
    if (!session?.user?.id) {
      setSummaryLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/billing/summary", { cache: "no-store" });
      if (res.ok) {
        setSummary(await res.json());
      }
    } finally {
      setSummaryLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const startCheckout = async (tier: "PRO" | "BUSINESS") => {
    if (!session) {
      router.push(`/${locale}/sign-in`);
      return;
    }

    try {
      setStarting(tier);
      const res = await fetch("/api/billing/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || "Could not start checkout.");
      }

      router.push(`/${locale}/checkout/${payload.id}`);
    } catch (error) {
      toast({
        title: "Checkout could not start",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setStarting(null);
    }
  };

  const paidOrders = summary?.orders.filter((order) => order.status === "PAID") ?? [];

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5 sm:px-8">
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to workspace
          </Link>
          <span className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center border border-foreground/70 font-mono text-[10px]">
              TF
            </span>
            <span className="font-display text-xl leading-none">TaskFlow</span>
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-[600px]">
            <p className="eyebrow">Plans</p>
            <h1 className="mt-3 font-display text-5xl leading-[1.02] sm:text-6xl">
              Kept simple.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              One free plan that is genuinely useful, and two paid plans for
              people who want more room and every palette. No hidden seats, no
              surprise meters.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span
              className={cn(
                "flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em]",
                isPaid
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {isPaid ? <Crown className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              {isPaid ? `${PLAN_META[currentPlan].name} active` : "Free plan"}
            </span>
            {isPaid && summary?.planExpiresAt && (
              <p className="text-[11px] text-muted-foreground">
                Access until {formatDate(summary.planExpiresAt)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 border border-border p-1">
            {(["MONTH", "YEAR"] as BillingIntervalValue[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setBillingInterval(value)}
                className={cn(
                  "px-4 py-1.5 text-xs transition-colors",
                  interval === value
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {value === "MONTH" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
          {interval === "YEAR" && (
            <span className="animate-rise font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
              Two months free
            </span>
          )}
        </div>

        <div className="mt-7 grid gap-px border border-border bg-border lg:grid-cols-3">
          {(["FREE", "PRO", "BUSINESS"] as const).map((tier) => {
            const isCurrent = currentPlan === tier;
            const isLower = PLAN_ORDER[tier] < PLAN_ORDER[currentPlan];
            const isPopular = tier === "PRO";
            const price =
              tier === "FREE"
                ? 0
                : PLAN_PRICING[tier][interval];
            const yearly = tier !== "FREE" && interval === "YEAR";
            const actionable = session && !isCurrent && !isLower;

            return (
              <div
                key={tier}
                className={cn(
                  "group relative flex flex-col bg-card p-7 transition-[background-color,transform] duration-300",
                  isPopular && "bg-card",
                  isCurrent && "bg-secondary/50"
                )}
              >
                {isPopular && <span className="absolute inset-x-0 top-0 h-0.5 bg-primary" />}
                <div className="flex min-h-[34px] items-start justify-between gap-3">
                  <h2 className="font-display text-3xl leading-none">
                    {PLAN_META[tier].name}
                  </h2>
                  {isCurrent ? (
                    <span className="border border-primary/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-primary">
                      Current
                    </span>
                  ) : isPopular ? (
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-primary">
                      Recommended
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                  {descriptions[tier]}
                </p>

                <p
                  key={`${tier}-${interval}`}
                  className="mt-8 animate-rise font-mono text-3xl leading-none"
                >
                  {formatPrice(price)}
                  <span className="ml-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                    / {tier === "FREE" ? "forever" : yearly ? "year" : "month"}
                  </span>
                </p>
                {yearly && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {formatPrice(
                      Math.round(PLAN_PRICING[tier as "PRO" | "BUSINESS"][interval] / 12)
                    )}{" "}
                    a month, billed once
                  </p>
                )}
                {tier !== "FREE" && interval === "MONTH" && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    One-time payment. Save 17% on a yearly pass.
                  </p>
                )}
                {tier !== "FREE" && interval === "YEAR" && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    One payment, no auto-renewal.
                  </p>
                )}

                <Button
                  onClick={() => {
                    if (tier === "FREE") {
                      if (!session) router.push(`/${locale}/sign-in`);
                      else router.push(`/${locale}/dashboard`);
                      return;
                    }
                    startCheckout(tier);
                  }}
                  disabled={
                    Boolean(starting) ||
                    checkoutUnavailable ||
                    (tier === "FREE" && isCurrent) ||
                    (tier !== "FREE" && isLower) ||
                    (isPaid && tier === "FREE")
                  }
                  variant={isPopular ? "default" : "outline"}
                  className="mt-6 w-full"
                >
                  {starting === tier ? (
                    <>
                      <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                      Preparing…
                    </>
                  ) : isCurrent ? (
                    tier === "FREE" ? (
                      "Current plan"
                    ) : (
                      "Extend access"
                    )
                  ) : isLower || (isPaid && tier === "FREE") ? (
                    "Included in your plan"
                  ) : tier === "FREE" ? (
                    session ? "Open workspace" : "Start free"
                  ) : (
                    <>Choose {PLAN_META[tier].name}</>
                  )}
                </Button>

                <ul className="mt-7 space-y-2.5 border-t border-border pt-5">
                  {features[tier].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-[13px] text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {summary?.testMode && (
          <p className="mt-6 flex max-w-[720px] items-start gap-2 border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-relaxed text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            The built-in TaskFlow Pay gateway is in test mode. One-time
            payments activate prepaid access instantly but move no money. Add
            Razorpay keys for live billing.
          </p>
        )}

        {isPaid && summary && (
          <section className="mt-10 grid gap-px border border-border bg-border lg:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-card p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Your plan</p>
                  <h2 className="mt-2 font-display text-2xl">
                    {PLAN_META[summary.plan]?.name ?? summary.plan}{" "}
                    <span className="font-sans text-xs text-muted-foreground">
                      · {intervalLabel(summary.billingInterval)}
                    </span>
                  </h2>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Access until {formatDate(summary.planExpiresAt)}
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-[480px] border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
                This is prepaid access. Nothing is charged automatically, and
                every feature stays available until the date above. Extending
                adds another {intervalLabel(summary.billingInterval).toLowerCase()} period
                to the remaining time.
              </p>
            </div>

            <div className="bg-card p-6 sm:p-7">
              <p className="eyebrow flex items-center gap-1.5">
                <ReceiptText className="h-3 w-3" />
                Billing history
              </p>
              {paidOrders.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  No paid invoices yet.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {paidOrders.slice(0, 4).map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center justify-between gap-3 py-2.5 text-[11px]"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {PLAN_META[order.tier]?.name ?? order.tier} ·{" "}
                          {intervalLabel(order.interval)}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          {order.receipt} · {formatDate(order.paidAt)}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono">
                        {formatPrice(order.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {summaryLoading
              ? "Checking billing status…"
              : summary?.provider === "RAZORPAY"
                ? "Payments handled by Razorpay."
                : summary?.provider === "INTERNAL"
                  ? "Test gateway enabled on this deployment."
                  : "Checkout is not configured on this deployment."}
          </span>
          <Link
            href={`/${locale}/dashboard/settings/theme`}
            className="group inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            Preview the palettes
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
