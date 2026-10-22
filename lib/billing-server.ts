import crypto from "crypto";
import { db } from "@/lib/db";
import { razorpay } from "@/lib/razorpay";
import {
  addBillingPeriod,
  PLAN_PRICING,
  type BillingIntervalValue,
  type PaidTier,
} from "@/lib/billing";

export class BillingError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const razorpayConfigured = () =>
  Boolean(
    (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID) &&
      process.env.RAZORPAY_KEY_SECRET
  );

export const testPaymentsAllowed = () =>
  process.env.BILLING_ALLOW_TEST_PAYMENTS === "true" ||
  process.env.NODE_ENV === "development";

export const getBillingProvider = (): "RAZORPAY" | "INTERNAL" | null => {
  if (razorpayConfigured()) return "RAZORPAY";
  if (testPaymentsAllowed()) return "INTERNAL";
  return null;
};

export const getRazorpayKeyId = () =>
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
  process.env.RAZORPAY_KEY_ID ||
  null;

const isTier = (value: unknown): value is PaidTier =>
  value === "PRO" || value === "BUSINESS";

const isInterval = (value: unknown): value is BillingIntervalValue =>
  value === "MONTH" || value === "YEAR";

const publicOrder = (order: {
  id: string;
  tier: string;
  interval: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerOrderId: string | null;
  receipt: string;
  createdAt: Date;
  paidAt: Date | null;
}) => ({
  id: order.id,
  tier: order.tier,
  interval: order.interval,
  amount: order.amount,
  currency: order.currency,
  status: order.status,
  provider: order.provider,
  providerOrderId: order.providerOrderId,
  receipt: order.receipt,
  createdAt: order.createdAt.toISOString(),
  paidAt: order.paidAt?.toISOString() ?? null,
});

export async function reconcileBilling(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      plan: true,
      billingInterval: true,
      planStartedAt: true,
      planExpiresAt: true,
    },
  });

  if (!user) throw new BillingError("Account not found.", 404);

  const expired =
    user.plan !== "FREE" &&
    user.planExpiresAt !== null &&
    user.planExpiresAt.getTime() <= Date.now();

  if (!expired) return user;

  return db.user.update({
    where: { id: userId },
    data: {
      plan: "FREE",
      planExpiresAt: null,
    },
    select: {
      id: true,
      plan: true,
      billingInterval: true,
      planStartedAt: true,
      planExpiresAt: true,
    },
  });
}

export async function createBillingOrder(input: {
  userId: string;
  tier: unknown;
  interval: unknown;
}) {
  const { userId, tier, interval } = input;

  if (!isTier(tier) || !isInterval(interval)) {
    throw new BillingError("Choose a valid plan and billing interval.");
  }

  const amount = PLAN_PRICING[tier][interval];

  await reconcileBilling(userId);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      plan: true,
      billingInterval: true,
      planExpiresAt: true,
    },
  });

  if (!user) throw new BillingError("Account not found.", 404);

  const provider = getBillingProvider();

  if (!provider) {
    throw new BillingError(
      "Checkout is not configured on this deployment. Add Razorpay keys or enable the built-in test gateway.",
      503
    );
  }

  const receipt = `tf_${user.id.slice(-6)}_${Date.now().toString(36)}`;

  let providerOrderId: string | null = null;

  if (provider === "RAZORPAY") {
    try {
      const providerOrder = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt,
        notes: {
          userId: user.id,
          tier,
          interval,
        },
      });
      providerOrderId = providerOrder.id;
    } catch (error) {
      console.error("[BILLING_PROVIDER_ORDER]", error);
      throw new BillingError(
        "The payment provider could not start this order. Please try again.",
        502
      );
    }
  }

  const order = await db.billingOrder.create({
    data: {
      userId: user.id,
      tier,
      interval,
      amount,
      currency: "INR",
      provider,
      providerOrderId,
      receipt,
    },
  });

  await db.billingOrder.updateMany({
    where: {
      userId: user.id,
      status: "PENDING",
      id: { not: order.id },
    },
    data: { status: "CANCELLED" },
  });

  return {
    ...publicOrder(order),
    testMode: provider === "INTERNAL",
    razorpayKeyId: provider === "RAZORPAY" ? getRazorpayKeyId() : null,
    customer: {
      name: user.name || user.username,
      email: user.email || "",
    },
  };
}

export async function getBillingOrderForUser(orderId: string, userId: string) {
  const order = await db.billingOrder.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) throw new BillingError("Order not found.", 404);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      planExpiresAt: true,
    },
  });

  const now = new Date();
  const currentExpiry = user?.planExpiresAt ?? null;

  let expectedAccessEndsAt: Date | null = null;

  if (order.status === "PAID") {
    expectedAccessEndsAt = currentExpiry;
  } else {
    const extending =
      user?.plan === order.tier &&
      currentExpiry !== null &&
      currentExpiry.getTime() > now.getTime();
    const periodStart = extending ? currentExpiry! : now;
    expectedAccessEndsAt = addBillingPeriod(
      periodStart,
      order.interval as BillingIntervalValue
    );
  }

  return {
    ...publicOrder(order),
    expectedAccessEndsAt: expectedAccessEndsAt?.toISOString() ?? null,
    testMode: order.provider === "INTERNAL",
    razorpayKeyId:
      order.provider === "RAZORPAY" ? getRazorpayKeyId() : null,
  };
}

export async function fulfillBillingOrder(
  orderId: string,
  providerPaymentId?: string
) {
  const existingByPayment = providerPaymentId
    ? await db.billingOrder.findUnique({ where: { providerPaymentId } })
    : null;

  if (existingByPayment) return publicOrder(existingByPayment);

  const order = await db.billingOrder.findUnique({ where: { id: orderId } });

  if (!order) throw new BillingError("Order not found.", 404);
  if (order.status === "PAID") return publicOrder(order);
  if (order.status !== "PENDING") {
    throw new BillingError("This order can no longer be paid.", 409);
  }

  const now = new Date();

  await db.$transaction(async (tx) => {
    const claimed = await tx.billingOrder.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: {
        status: "PAID",
        paidAt: now,
        providerPaymentId:
          providerPaymentId ??
          (order.provider === "INTERNAL" ? `internal_${order.id}` : undefined),
      },
    });

    if (claimed.count === 0) return;

    await tx.billingOrder.updateMany({
      where: {
        userId: order.userId,
        status: "PENDING",
        id: { not: order.id },
      },
      data: { status: "CANCELLED" },
    });

    const current = await tx.user.findUnique({
      where: { id: order.userId },
      select: {
        plan: true,
        planStartedAt: true,
        planExpiresAt: true,
      },
    });

    // Buying the same plan again extends the remaining paid time.
    const extending =
      current?.plan === order.tier &&
      current.planExpiresAt !== null &&
      current.planExpiresAt.getTime() > now.getTime();

    const periodStart = extending ? current!.planExpiresAt! : now;
    const expiresAt = addBillingPeriod(
      periodStart,
      order.interval as BillingIntervalValue
    );

    await tx.user.update({
      where: { id: order.userId },
      data: {
        plan: order.tier,
        billingInterval: order.interval,
        planStartedAt: extending ? current?.planStartedAt ?? now : now,
        planExpiresAt: expiresAt,
      },
    });
  });

  const paidOrder = await db.billingOrder.findUnique({ where: { id: order.id } });
  if (!paidOrder) throw new BillingError("Order not found.", 404);
  return publicOrder(paidOrder);
}

export async function verifyRazorpayPayment(input: {
  orderId: string;
  userId: string;
  razorpayPaymentId: unknown;
  razorpaySignature: unknown;
}) {
  const { orderId, userId, razorpayPaymentId, razorpaySignature } = input;

  if (
    typeof razorpayPaymentId !== "string" ||
    typeof razorpaySignature !== "string"
  ) {
    throw new BillingError("The payment response was incomplete.");
  }

  const order = await db.billingOrder.findFirst({
    where: { id: orderId, userId, provider: "RAZORPAY" },
  });

  if (!order?.providerOrderId) {
    throw new BillingError("Order not found.", 404);
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new BillingError("Razorpay is not configured.", 503);
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${order.providerOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(razorpaySignature, "utf8");

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new BillingError("Payment signature verification failed.", 400);
  }

  return fulfillBillingOrder(order.id, razorpayPaymentId);
}

export async function getBillingSummary(userId: string) {
  const user = await reconcileBilling(userId);

  const orders = await db.billingOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return {
    plan: user.plan,
    billingInterval: user.billingInterval,
    planStartedAt: user.planStartedAt?.toISOString() ?? null,
    planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
    provider: getBillingProvider(),
    testMode: getBillingProvider() === "INTERNAL",
    orders: orders.map(publicOrder),
  };
}
