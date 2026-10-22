import { AddTaskShortcut } from "@/components/addTaskShortCut/AddTaskShortcut";
import { DashboardHeader } from "@/components/header/DashboardHeader";
import { SecurityCard } from "@/components/settings/security/SecurityCard";
import { checkIfUserCompletedOnboarding } from "@/lib/checkIfUserCompletedOnboarding";

const SecuritySettings = async () => {
  const session = await checkIfUserCompletedOnboarding("/dashboard/settings");

  return (
    <>
      <DashboardHeader>
        <AddTaskShortcut userId={session.user.id} />
      </DashboardHeader>
      <main className="min-h-full">
        <div className="mx-auto w-full max-w-[900px] px-5 py-8 sm:px-8">
          <SecurityCard />
        </div>
      </main>
    </>
  );
};

export default SecuritySettings;
