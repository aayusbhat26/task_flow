import { AppShell } from "@/components/shell/AppShell";
import { DashboardHeader } from "@/components/header/DashboardHeader";
import { checkIfUserCompletedOnboarding } from "@/lib/checkIfUserCompletedOnboarding";

const GamingLayout = async ({ children }: { children: React.ReactNode }) => {
  await checkIfUserCompletedOnboarding("/gaming");

  return (
    <AppShell>
      <DashboardHeader
        addManualRoutes={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Achievements", href: "/gaming" },
        ]}
      />
      {children}
    </AppShell>
  );
};

export default GamingLayout;
