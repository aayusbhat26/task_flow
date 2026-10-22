import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  BillingError,
  verifyRazorpayPayment,
} from "@/lib/billing-server";

export async function POST(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const order = await verifyRazorpayPayment({
      orderId: params.orderId,
      userId: session.user.id,
      razorpayPaymentId: body?.razorpay_payment_id,
      razorpaySignature: body?.razorpay_signature,
    });
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("[BILLING_RAZORPAY_VERIFY]", error);
    return NextResponse.json(
      { error: "The payment could not be verified." },
      { status: 500 }
    );
  }
}
