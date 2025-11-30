import { AddTaskShortcut } from "@/components/addTaskShortCut/AddTaskShortcut";
import { DashboardHeader } from "@/components/header/DashboardHeader";
import { InviteUsers } from "@/components/inviteUsers/InviteUsers";
import { LeaveWorkspace } from "@/components/workspaceMainPage/shortcuts/leaveWorkspace/LeaveWorkspace";
import { AutosaveIndicatorProvider } from "@/context/AutosaveIndicator";
import { AutoSaveMindMapProvider } from "@/context/AutoSaveMindMap";
import { getMindMapData, getUserWorkspaceRoleData, getWorkspaceData } from "@/lib/server-actions";
import { checkIfUserCompletedOnboarding } from "@/lib/checkIfUserCompletedOnboarding";
import { redirect } from "next/navigation";
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

const EditMindMapPage = async ({
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
  if (!canEdit)
    redirect(`/dashboard/workspace/${workspace_id}/tasks/task/${mind_map_id}`);

  return (
    <AutosaveIndicatorProvider>
      <AutoSaveMindMapProvider>
        <DashboardHeader showBackBtn hideBreadCrumb showingSavingStatus>
          {(userRole === "ADMIN" || userRole === "OWNER") && (
            <InviteUsers workspace={workspace} />
          )}
          <AddTaskShortcut userId={session.user.id} />
        </DashboardHeader>
        <main className="flex flex-col gap-2 h-full">
          <MindMap
            initialInfo={mindMap}
            workspaceId={workspace.id}
            canEdit={canEdit}
            initialActiveTags={mindMap.tags}
          />
        </main>
      </AutoSaveMindMapProvider>{" "}
    </AutosaveIndicatorProvider>
  );
};

export default EditMindMapPage;
