import { AppShell } from "@/components/shell/AppShell";
import { DashboardHeader } from "@/components/header/DashboardHeader";
import { checkIfUserCompletedOnboarding } from "@/lib/checkIfUserCompletedOnboarding";

const DSALayout = async ({ children }: { children: React.ReactNode }) => {
  await checkIfUserCompletedOnboarding("/dsa");

  return (
    <AppShell>
      <DashboardHeader
        addManualRoutes={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "DSA practice", href: "/dsa" },
        ]}
      />
      {children}
    </AppShell>
  );
};

export default DSALayout;
