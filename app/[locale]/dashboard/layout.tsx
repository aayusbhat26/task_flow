import { AppShell } from "@/components/shell/AppShell";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return <AppShell>{children}</AppShell>;
};

export default DashboardLayout;
