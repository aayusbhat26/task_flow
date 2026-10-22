import { getAuthSession } from "@/lib/auth";
import { SidebarContainer } from "./SidebarContainer";
import { db } from "@/lib/db";

export const Sidebar = async () => {
  const session = await getAuthSession();
  if (!session) return null;

  const [subscriptions, userSettings] = await Promise.all([
    db.subscription.findMany({
      where: { userId: session.user.id },
      include: {
        workspace: {
          include: {
            subscribers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { showDSA: true },
    }),
  ]);

  const userWorkspaces = subscriptions.map((subscription) => subscription.workspace);
  const userAdminWorkspaces = subscriptions
    .filter(
      (subscription) =>
        subscription.userRole === "ADMIN" || subscription.userRole === "OWNER"
    )
    .map((subscription) => subscription.workspace);

  return (
    <SidebarContainer
      userWorkspaces={userWorkspaces}
      userAdminWorkspaces={userAdminWorkspaces}
      userId={session.user.id}
      showDSA={userSettings?.showDSA ?? true}
    />
  );
};
