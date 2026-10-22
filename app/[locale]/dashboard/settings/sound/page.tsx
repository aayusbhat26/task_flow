import { AddTaskShortcut } from "@/components/addTaskShortCut/AddTaskShortcut";
import { DashboardHeader } from "@/components/header/DashboardHeader";
import { SoundSettingsForm } from "@/components/settings/sound/SoundSettingsForm";
import { checkIfUserCompletedOnboarding } from "@/lib/checkIfUserCompletedOnboarding";
import { db } from "@/lib/db";

const SoundSettings = async () => {
  const session = await checkIfUserCompletedOnboarding("/dashboard/settings/sound");

  // Get or create user settings
  let userSettings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!userSettings) {
    userSettings = await db.userSettings.create({
      data: {
        userId: session.user.id,
        taskCompletionSound: "TASK_COMPLETE",
        questionCompletionSound: "QUESTION_COMPLETE",
        soundVolume: 0.6,
        soundsEnabled: true,
        showDSA: true,
      },
    });
  }

  return (
    <>
      <DashboardHeader
        addManualRoutes={[
          {
            name: "DASHBOARD",
            href: "/dashboard",
            useTranslate: true,
          },
          {
            name: "Settings",
            href: "/dashboard/settings",
          },
          {
            name: "Sound",
            href: "/dashboard/settings/sound",
          },
        ]}
      >
        <AddTaskShortcut userId={session.user.id} />
      </DashboardHeader>
      <main className="flex flex-col gap-2">
        <SoundSettingsForm userSettings={userSettings} />
      </main>
    </>
  );
};

export default SoundSettings;
