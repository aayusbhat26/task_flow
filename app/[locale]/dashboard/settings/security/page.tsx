import { AddTaskShortcut } from "@/components/addTaskShortCut/AddTaskShortcut";
import { DashboardHeader } from "@/components/header/DashboardHeader";
import { SecurityCard } from "@/components/settings/security/SecurityCard";
import { checkIfUserCompletedOnboarding } from "@/lib/checkIfUserCompletedOnboarding";
import { db } from "@/lib/db";

const SecuritySettings = async () => {
  const session = await checkIfUserCompletedOnboarding("/dashboard/settings");
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { hashedPassword: true },
  });

  return (
    <>
      <DashboardHeader>
        <AddTaskShortcut userId={session.user.id} />
      </DashboardHeader>
      <main className="min-h-full">
        <div className="mx-auto w-full max-w-[900px] px-5 py-8 sm:px-8">
          <SecurityCard hasPassword={Boolean(user?.hashedPassword)} />
        </div>
      </main>
    </>
  );
};

export default SecuritySettings;
