import { getAuthSession } from "@/lib/auth";
import { SidebarContainer } from "./SidebarContainer";
import { getUserAdminWorkspaces, getWorkspaces } from "@/lib/api";
import { db } from "@/lib/db";

export const Sidebar = async () => {
  const session = await getAuthSession();
  if (!session) return null;

  const [userWorkspaces, userAdminWorkspaces, userSettings] = await Promise.all([
    getWorkspaces(session.user.id),
    getUserAdminWorkspaces(session.user.id),
    db.userSettings.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  return (
    <SidebarContainer
      userWorkspaces={userWorkspaces ? userWorkspaces : []}
      userAdminWorkspaces={userAdminWorkspaces ? userAdminWorkspaces : []}
      userId={session.user.id}
      showDSA={userSettings?.showDSA ?? true}
    />
  );
};
