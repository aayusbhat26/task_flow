import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompletionSoundEffect } from "@prisma/client";
import { z } from "zod";

const soundSettingsSchema = z.object({
  soundsEnabled: z.boolean(),
  soundVolume: z.number().min(0).max(100),
  taskCompletionSound: z.string(),
  questionCompletionSound: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const result = soundSettingsSchema.safeParse(body);

    if (!result.success) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    const {
      soundsEnabled,
      soundVolume,
      taskCompletionSound,
      questionCompletionSound,
    } = result.data;

    // Get or create user settings
    let userSettings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!userSettings) {
      userSettings = await db.userSettings.create({
        data: {
          userId: session.user.id,
          taskCompletionSound: taskCompletionSound as CompletionSoundEffect,
          questionCompletionSound: questionCompletionSound as CompletionSoundEffect,
          soundVolume: soundVolume / 100,
          soundsEnabled,
          showDSA: true,
        },
      });
    } else {
      userSettings = await db.userSettings.update({
        where: { userId: session.user.id },
        data: {
          taskCompletionSound: taskCompletionSound as CompletionSoundEffect,
          questionCompletionSound: questionCompletionSound as CompletionSoundEffect,
          soundVolume: soundVolume / 100,
          soundsEnabled,
        },
      });
    }

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error("Error updating sound settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
