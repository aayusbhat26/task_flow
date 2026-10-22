import { Sidebar } from "@/components/sidebar/Sidebar";
import { ToggleSidebarProvider } from "@/context/ToggleSidebar";
import { UserActivityStatusProvider } from "@/context/UserActivityStatus";
import { UserEditableWorkspacesProvider } from "@/context/UserEditableWorkspaces";
import { PerformanceMonitor } from "@/components/common/PerformanceMonitor";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <UserActivityStatusProvider>
      <UserEditableWorkspacesProvider>
        <ToggleSidebarProvider>
          <PerformanceMonitor />
          <div className="flex h-dvh w-full overflow-hidden bg-background">
            <Sidebar />
            <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
              {children}
            </div>
          </div>
        </ToggleSidebarProvider>
      </UserEditableWorkspacesProvider>
    </UserActivityStatusProvider>
  );
};
