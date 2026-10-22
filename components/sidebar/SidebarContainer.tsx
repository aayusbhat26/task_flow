"use client";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useToggleSidebar } from "@/context/ToggleSidebar";
import { OptionsSidebar } from "./optionsSidebar/OptionsSidebar";
import { ShortcutSidebar } from "./shortcutSidebar/ShortcutSidebar";
import { CloseSidebar } from "./CloseSidebar";
import { Workspace } from "@prisma/client";
import { getWorkspaces } from "@/lib/api";

interface Props {
  userWorkspaces: Workspace[];
  userId: string;
  userAdminWorkspaces: Workspace[];
  showDSA: boolean;
}

export const SidebarContainer = ({
  userWorkspaces,
  userId,
  userAdminWorkspaces,
  showDSA,
}: Props) => {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useToggleSidebar();
  // Use React Query to fetch workspaces
  const {
    data: workspaces = [],
    refetch: refetchWorkspaces,
  } = useQuery({
    queryKey: ["userWorkspaces", userId],
    queryFn: () => getWorkspaces(userId),
    initialData: userWorkspaces,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Reduce retries from default 3 to 2
    retryDelay: 1000, // 1 second delay between retries
  });
  const createdWorkspaces = workspaces.filter(
    (workspace) => workspace.creatorId == userId
  );
  // Always filter admin workspaces from latest workspaces
  const latestAdminWorkspaces = workspaces.filter(
    (workspace: any) =>
      Array.isArray(workspace.subscribers) &&
      workspace.subscribers.some(
        (sub: any) => sub.user.id === userId && sub.userRole === "ADMIN"
      )
  );
  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full border-r border-border bg-background transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ShortcutSidebar
          userWorkspaces={workspaces}
          createdWorkspaces={createdWorkspaces.length}
          refetchWorkspaces={refetchWorkspaces}
          showDSA={showDSA}
        />
        {!(pathname && (pathname.includes("/notes") || pathname.includes("/chat") || pathname.includes("/groups/") || pathname.includes("/channel/"))) && (
          <OptionsSidebar
            createdWorkspaces={createdWorkspaces.length}
            userAdminWorkspaces={userAdminWorkspaces}
            userWorkspaces={workspaces}
          />
        )}
        <CloseSidebar />
      </aside>
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 bg-foreground/35 lg:hidden ${
          isOpen ? "block" : "hidden"
        }`}
        aria-hidden
      />
    </>
  );
};
