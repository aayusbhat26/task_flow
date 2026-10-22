"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  addBillingPeriod,
  formatPrice,
  intervalLabel,
  PLAN_META,
  type BillingIntervalValue,
} from "@/lib/billing";
import { cn } from "@/lib/utils";

type CheckoutOrder = {
  id: string;
  tier: string;
  interval: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerOrderId: string | null;
  receipt: string;
  createdAt: string;
  paidAt: string | null;
  expectedAccessEndsAt: string | null;
  testMode: boolean;
  razorpayKeyId: string | null;
};

interface Props {
  order: CheckoutOrder;
  locale: string;
  customer: { name: string; email: string };
}

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export const CheckoutClient = ({ order, locale, customer }: Props) => {
  const [status, setStatus] = useState<"review" | "processing" | "paid">(
    order.status === "PAID" ? "paid" : "review"
  );
  const [method, setMethod] = useState<"CARD" | "UPI">("CARD");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { update } = useSession();
  const { toast } = useToast();

  const plan = PLAN_META[order.tier] ?? PLAN_META.PRO;
  const renewsAt = useMemo(() => {
    if (order.expectedAccessEndsAt) {
      return formatDate(order.expectedAccessEndsAt);
    }
    return formatDate(
      addBillingPeriod(
        new Date(),
        order.interval as BillingIntervalValue
      ).toISOString()
    );
  }, [order.expectedAccessEndsAt, order.interval]);

  useEffect(() => {
    if (status === "paid") {
      router.refresh();
    }
  }, [status, router]);

  const finish = async () => {
    setStatus("paid");
    try {
      await update();
    } catch {
      // The plan is already recorded server-side; the next session refresh will pick it up.
    }
    toast({
      title: `${plan.name} plan active`,
      description: "Your workspace now has the full palette and new limits.",
    });
  };

  const payWithTestGateway = async () => {
    setError(null);
    setStatus("processing");
    try {
      const res = await fetch(`/api/billing/orders/${order.id}/pay`, {
        method: "POST",
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Payment failed.");
      await finish();
    } catch (paymentError) {
      setStatus("review");
      const message =
        paymentError instanceof Error ? paymentError.message : "Payment failed.";
      setError(message);
      toast({
        title: "Payment not completed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const payWithRazorpay = async () => {
    setError(null);
    setStatus("processing");
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("The Razorpay checkout could not be loaded.");

      const checkout = new (window as any).Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "TaskFlow",
        description: `${plan.name} · ${intervalLabel(order.interval)}`,
        order_id: order.providerOrderId,
        prefill: customer,
        theme: { color: "#7a2e32" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const res = await fetch(`/api/billing/orders/${order.id}/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const payload = await res.json();
            if (!res.ok) {
              throw new Error(payload?.error || "Verification failed.");
            }
            await finish();
          } catch (verifyError) {
            setStatus("review");
            const message =
              verifyError instanceof Error
                ? verifyError.message
                : "Verification failed.";
            setError(message);
            toast({
              title: "Payment verification failed",
              description: message,
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: () => {
            setStatus("review");
          },
        },
      });

      checkout.on("payment.failed", (response: any) => {
        setStatus("review");
        const message =
          response?.error?.description || "The payment was declined.";
        setError(message);
        toast({
          title: "Payment failed",
          description: message,
          variant: "destructive",
        });
      });

      checkout.open();
    } catch (checkoutError) {
      setStatus("review");
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Checkout could not start.";
      setError(message);
      toast({
        title: "Checkout unavailable",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (status === "paid") {
    return (
      <div className="mx-auto flex min-h-[62vh] w-full max-w-[560px] flex-col items-center justify-center px-5 text-center">
        <div className="flex h-14 w-14 animate-rise items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <Check className="h-6 w-6 text-primary" strokeWidth={1.8} />
        </div>
        <p className="eyebrow mt-6">Payment received</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
          {plan.name} is yours.
        </h1>
        <p className="mt-3 max-w-[380px] text-sm leading-relaxed text-muted-foreground">
          Every palette and the higher mind-map limit are active now. A receipt
          was recorded under your billing history.
        </p>

        <div className="mt-7 w-full max-w-[400px] border border-border bg-card p-5 text-left">
          <dl className="space-y-2.5 text-[11px]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Plan</dt>
              <dd>{plan.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Billing</dt>
              <dd>{intervalLabel(order.interval)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Access until</dt>
              <dd>{renewsAt}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Receipt</dt>
              <dd className="font-mono text-[10px] uppercase tracking-wider">
                {order.receipt}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-2.5">
              <dt className="text-muted-foreground">Paid today</dt>
              <dd className="font-mono">{formatPrice(order.amount)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href={`/${locale}/dashboard/settings/theme`}>
              Try a new palette
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${locale}/upgrade`}>View billing</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href={`/${locale}/upgrade`}
        className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to plans
      </Link>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="eyebrow">Secure checkout</p>
          <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">
            One step away.
          </h1>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
            order.testMode
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : "border-border text-muted-foreground"
          )}
        >
          {order.testMode ? <Sparkles className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
          {order.testMode ? "Test mode" : "Razorpay secure"}
        </span>
      </div>

      <div className="mt-8 grid gap-px border border-border bg-border lg:grid-cols-[1.05fr_0.95fr]">
        <section className="bg-card p-6 sm:p-8">
          <p className="eyebrow">Order summary</p>
          <div className="mt-5 flex items-start justify-between gap-6 border-b border-border pb-5">
            <div>
              <h2 className="font-display text-3xl leading-none">{plan.name}</h2>
              <p className="mt-2 text-xs text-muted-foreground">{plan.blurb}</p>
            </div>
            <p className="font-mono text-lg">{formatPrice(order.amount)}</p>
          </div>

          <dl className="mt-5 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Billing</dt>
              <dd>{intervalLabel(order.interval)}, one-time</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Auto-renewal</dt>
              <dd>None</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Access until</dt>
              <dd>{renewsAt}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Account</dt>
              <dd className="max-w-[220px] truncate">{customer.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Receipt</dt>
              <dd className="font-mono text-[10px] uppercase tracking-wider">
                {order.receipt}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs font-medium">Total due today</span>
            <span className="font-mono text-xl">{formatPrice(order.amount)}</span>
          </div>

          <div className="mt-6 space-y-2 border border-border bg-secondary/30 p-4">
            {[
              "Every palette in the collection",
              order.tier === "BUSINESS" ? "Unlimited mind maps" : "8 mind maps",
              "Plan badge and billing history",
            ].map((item) => (
              <p key={item} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="bg-card p-6 sm:p-8">
          <p className="eyebrow">Payment</p>

          {order.provider === "INTERNAL" ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-px border border-border bg-border">
                <button
                  type="button"
                  onClick={() => setMethod("CARD")}
                  className={cn(
                    "flex items-center justify-center gap-2 bg-card py-3 text-xs transition-colors",
                    method === "CARD"
                      ? "bg-secondary font-medium"
                      : "text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("UPI")}
                  className={cn(
                    "flex items-center justify-center gap-2 bg-card py-3 text-xs transition-colors",
                    method === "UPI"
                      ? "bg-secondary font-medium"
                      : "text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  <Smartphone className="h-4 w-4" />
                  UPI
                </button>
              </div>

              <div className="mt-4 border border-dashed border-border p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
                  Built-in test gateway
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  This deployment is running TaskFlow Pay in test mode. No card
                  or UPI details are collected and no money moves. Pressing pay
                  activates the plan immediately so you can review the full
                  experience.
                </p>
                <div className="mt-4 flex items-center gap-2 border border-border bg-secondary/40 px-3 py-2.5 text-[11px] text-muted-foreground">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  {method === "CARD"
                    ? "Card payments simulated · no card stored"
                    : "UPI intent simulated · no mandate created"}
                </div>
              </div>

              {error && (
                <p className="mt-4 border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <Button
                onClick={payWithTestGateway}
                disabled={status === "processing"}
                className="mt-5 w-full gap-2"
                size="lg"
              >
                {status === "processing" ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                    Authorising…
                  </>
                ) : (
                  <>Pay {formatPrice(order.amount)}</>
                )}
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                You will complete this payment in Razorpay&apos;s secure
                checkout. TaskFlow never sees or stores your card details.
              </p>
              <div className="mt-4 flex items-center gap-2 border border-border bg-secondary/40 px-3 py-2.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Signature verified server-side
              </div>
              {error && (
                <p className="mt-4 border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}
              <Button
                onClick={payWithRazorpay}
                disabled={status === "processing"}
                className="mt-5 w-full gap-2"
                size="lg"
              >
                {status === "processing" ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                    Opening Razorpay…
                  </>
                ) : (
                  <>Continue to Razorpay</>
                )}
              </Button>
            </>
          )}

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <LockKeyhole className="h-3 w-3" />
            Prepaid access. No automatic renewal.
          </p>
        </section>
      </div>
    </div>
  );
};
