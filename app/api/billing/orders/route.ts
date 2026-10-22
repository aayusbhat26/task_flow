import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  BillingError,
  createBillingOrder,
} from "@/lib/billing-server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const order = await createBillingOrder({
      userId: session.user.id,
      tier: body?.tier,
      interval: body?.interval,
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("[BILLING_CREATE_ORDER]", error);
    return NextResponse.json(
      { error: "Could not create the order." },
      { status: 500 }
    );
  }
}
