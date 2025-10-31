import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3003";

export async function POST(request: Request) {
  try {
    // Get current session to extract user ID
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Forward the request to auth service with user ID
    const response = await fetch(`${AUTH_SERVICE_URL}/api/onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": session.user.id,
      },
      body: JSON.stringify({
        ...body,
        userId: session.user.id,
      }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Onboarding proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to auth service" },
      { status: 503 }
    );
  }
}
