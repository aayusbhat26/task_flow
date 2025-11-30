import { DashboardHeader } from "@/components/header/DashboardHeader";
import { InviteUsers } from "@/components/inviteUsers/InviteUsers";
import { MindMapPreviewCardWrapper } from "@/components/mindMaps/preview/MindMapPreviewCardWrapper";
import { AutosaveIndicatorProvider } from "@/context/AutosaveIndicator";
import { AutoSaveMindMapProvider } from "@/context/AutoSaveMindMap";
import { getMindMapData, getUserWorkspaceRoleData, getWorkspaceData } from "@/lib/server-actions";
import { changeCodeToEmoji } from "@/lib/changeCodeToEmoji";
import { checkIfUserCompletedOnboarding } from "@/lib/checkIfUserCompletedOnboarding";
import { LeaveWorkspace } from "@/components/workspaceMainPage/shortcuts/leaveWorkspace/LeaveWorkspace";
import { AddTaskShortcut } from "@/components/addTaskShortCut/AddTaskShortcut";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/common/LoadingScreen";

const MindMap = dynamic(
  () => import("@/components/mindMaps/MindMap").then((mod) => mod.MindMap),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);

interface Params {
  params: {
    workspace_id: string;
    mind_map_id: string;
  };
}

const MindMapPage = async ({
  params: { workspace_id, mind_map_id },
}: Params) => {
  const session = await checkIfUserCompletedOnboarding(
    `/dashboard/workspace/${workspace_id}/tasks/task/${mind_map_id}`
  );

  const [workspace, userRole, mindMap] = await Promise.all([
    getWorkspaceData(workspace_id, session.user.id),
    getUserWorkspaceRoleData(workspace_id, session.user.id),
    getMindMapData(mind_map_id, session.user.id),
  ]);

  if (!workspace || !userRole || !mindMap) notFound();

  const canEdit = userRole === "ADMIN" || userRole === "OWNER" ? true : false;

  const isSavedByUser =
    mindMap.savedMindMaps?.find(
      (mindMap) => mindMap.userId === session.user.id
    ) !== undefined;

  return (
    <AutosaveIndicatorProvider>
      <AutoSaveMindMapProvider>
        <DashboardHeader
          addManualRoutes={[
            {
              name: "DASHBOARD",
              href: "/dashboard",
              useTranslate: true,
            },
            {
              name: workspace.name,
              href: `/dashboard/workspace/${workspace_id}`,
            },
            {
              name: `${mindMap.title ? mindMap.title : "UNTITLED"}`,
              href: "/",
              emoji: changeCodeToEmoji(mindMap.emoji),
              useTranslate: mindMap.title ? false : true,
            },
          ]}
          showBackBtn
          hideBreadCrumb
          showingSavingStatus
        >
          {canEdit && <InviteUsers workspace={workspace} />}
          <AddTaskShortcut userId={session.user.id} />
        </DashboardHeader>
        <main className="flex flex-col gap-2 h-full mb-4">
          <MindMapPreviewCardWrapper
            mindMap={mindMap}
            userRole={userRole}
            isSavedByUser={isSavedByUser}
          >
            <MindMap
              initialInfo={mindMap}
              workspaceId={"cm2xbvkzx0003vxqszrp0sxa0"}
              canEdit={false}
              initialActiveTags={mindMap.tags}
            />
          </MindMapPreviewCardWrapper>
        </main>
      </AutoSaveMindMapProvider>{" "}
    </AutosaveIndicatorProvider>
  );
};

export default MindMapPage;
