import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fulfillBillingOrder } from "@/lib/billing-server";

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Razorpay webhooks are not configured." },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const payment = event?.payload?.payment?.entity;
  const providerOrderId =
    payment?.order_id ?? event?.payload?.order?.entity?.id;

  if (
    !providerOrderId ||
    (event?.event !== "payment.captured" && event?.event !== "order.paid")
  ) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const order = await db.billingOrder.findFirst({
    where: {
      provider: "RAZORPAY",
      providerOrderId,
    },
  });

  if (!order) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (
    payment &&
    (payment.amount !== order.amount ||
      String(payment.currency || "").toUpperCase() !== order.currency)
  ) {
    console.error("[RAZORPAY_WEBHOOK] Amount mismatch", {
      orderId: order.id,
      expected: order.amount,
      received: payment.amount,
    });
    return NextResponse.json({ error: "Amount mismatch." }, { status: 400 });
  }

  try {
    await fulfillBillingOrder(
      order.id,
      typeof payment?.id === "string" ? payment.id : undefined
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[RAZORPAY_WEBHOOK]", error);
    return NextResponse.json(
      { error: "Could not reconcile the payment." },
      { status: 500 }
    );
  }
}
