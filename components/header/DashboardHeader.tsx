import { getAuthSession } from "@/lib/auth";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { OpenSidebar } from "./OpenSidebar";
import { cn } from "@/lib/utils";
import { SavingStatus } from "./SavingStatus";
import { BackBtn } from "./BackBtn";
import { NotificationContainer } from "../notifications/NotificationContainer";
import { TasksModal } from "../tasks/TasksModal";
import { PointsDisplay } from "../points/PointsDisplay";
import { User } from "./User";

interface Props {
  addManualRoutes?: {
    name: string;
    href: string;
    useTranslate?: boolean;
    emoji?: string;
  }[];
  className?: string;
  children?: React.ReactNode;
  workspaceHref?: string;
  hideBreadCrumb?: boolean;
  showingSavingStatus?: boolean;
  showBackBtn?: boolean;
}

export const DashboardHeader = async ({
  addManualRoutes,
  className,
  children,
  workspaceHref,
  hideBreadCrumb,
  showingSavingStatus,
  showBackBtn,
}: Props) => {
  const session = await getAuthSession();
  if (!session) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <OpenSidebar />
        {showBackBtn && <BackBtn />}
        {showingSavingStatus && <SavingStatus />}
        {!hideBreadCrumb && (
          <div className="hidden min-w-0 sm:block">
            <BreadcrumbNav
              addManualRoutes={addManualRoutes}
              workspaceHref={workspaceHref}
            />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <PointsDisplay />
        <div className="flex items-center gap-0.5 sm:gap-1">
          {children}
          <TasksModal />
          <NotificationContainer userId={session.user.id} />
          <User
            profileImage={session.user.image}
            username={session.user.username ?? ""}
            email={session.user.email ?? ""}
            name={session.user.name}
            surname={session.user.surname}
          />
        </div>
      </div>
    </header>
  );
};
