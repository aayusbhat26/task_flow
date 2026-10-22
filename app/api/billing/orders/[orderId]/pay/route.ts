import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  BillingError,
  fulfillBillingOrder,
  testPaymentsAllowed,
} from "@/lib/billing-server";

export async function POST(
  _req: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!testPaymentsAllowed()) {
    return NextResponse.json(
      { error: "Test payments are disabled on this deployment." },
      { status: 403 }
    );
  }

  try {
    const order = await db.billingOrder.findFirst({
      where: {
        id: params.orderId,
        userId: session.user.id,
        provider: "INTERNAL",
      },
    });

    if (!order) {
      throw new BillingError("Order not found.", 404);
    }

    const paid = await fulfillBillingOrder(order.id);
    return NextResponse.json({ order: paid });
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("[BILLING_TEST_PAYMENT]", error);
    return NextResponse.json(
      { error: "The payment could not be completed." },
      { status: 500 }
    );
  }
}
