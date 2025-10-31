import { NextResponse } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3003";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Forward the request to auth service
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Login proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to auth service" },
      { status: 503 }
    );
  }
}
