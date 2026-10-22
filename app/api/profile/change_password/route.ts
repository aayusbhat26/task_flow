import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  changePasswordSchema,
  setPasswordSchema,
} from "@/schema/changePasswordSchema";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return new Response("Unauthorized", {
      status: 400,
      statusText: "Unauthorized User",
    });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return new NextResponse("User not found", {
        status: 404,
        statusText: "User not Found",
      });
    }

    const body: unknown = await request.json();
    let newPassword: string;

    if (user.hashedPassword) {
      const result = changePasswordSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json("ERRORS.WRONG_DATA", { status: 401 });
      }

      const passwordMatch = await bcrypt.compare(
        result.data.current_password,
        user.hashedPassword
      );
      if (!passwordMatch) {
        return new NextResponse("ERRORS.PASSWORD_MISMATCH", { status: 402 });
      }

      newPassword = result.data.new_password;
    } else {
      // OAuth-only accounts have no password to confirm yet.
      const result = setPasswordSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json("ERRORS.WRONG_DATA", { status: 401 });
      }

      newPassword = result.data.new_password;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (_) {
    return NextResponse.json("ERRORS.DB_ERROR", { status: 405 });
  }
}
