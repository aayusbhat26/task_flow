import { AddTaskShortcut } from "@/components/addTaskShortCut/AddTaskShortcut";
import { DashboardHeader } from "@/components/header/DashboardHeader";
import { AccountInfo } from "@/components/settings/account/AccountInfo";
import { DeleteAccount } from "@/components/settings/account/DeleteAccount";

import { Heading } from "@/components/settings/account/Heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { checkIfUserCompletedOnboarding } from "@/lib/checkIfUserCompletedOnboarding";
import { db } from "@/lib/db";
import Link from "next/link";

const Settings = async () => {
  const session = await checkIfUserCompletedOnboarding("/dashboard/settings");

  const userSettings = await db.userSettings.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  return (
    <>
      <DashboardHeader>
        <AddTaskShortcut userId={session.user.id} />
      </DashboardHeader>
      <main className="min-h-full">
        <div className="mx-auto w-full max-w-[900px] px-5 py-8 sm:px-8">
          <Heading />
          <AccountInfo
            session={session}
            showDSA={userSettings?.showDSA ?? true}
          />
          <DeleteAccount userEmail={session.user.email!} />
        </div>
      </main>
    </>
  );
};

export default Settings;
