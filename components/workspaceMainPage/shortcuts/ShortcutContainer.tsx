"use client";

import { UserPermission, Workspace } from "@prisma/client";
import { ShortcutContainerBtnItem } from "./ShortcutContainerBtnItem";
import {
  PencilRuler,
  Workflow,
} from "lucide-react";
import { LeaveWorkspace } from "@/components/workspaceMainPage/shortcuts/leaveWorkspace/LeaveWorkspace";
import { ShortcutContainerItemPrivateMessageDialog } from "./privateMessagesDialog/ShortcutContainerItemPrivateMessageDialog";
import { useNewTask } from "@/hooks/useNewTask";
import { useNewMindMap } from "@/hooks/useNewMindMap";
import { PermissionIndicator } from "@/components/workspaceMainPage/shortcuts/permissionIndicator/Permissionindicator";
import { ShortcutContainerLinkItem } from "./ShortcutContainerLinkItem";

interface Props {
  workspace: Workspace;
  userRole: UserPermission | null;
}

export const ShortcutContainer = ({ workspace, userRole }: Props) => {
  const { newTask, isPending: isNewTaskLoading } = useNewTask(workspace.id);
  const { newMindMap, isPending: isNewMindMapLoading } = useNewMindMap(
    workspace.id
  );
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border pb-5">
        <PermissionIndicator
          userRole={userRole}
          workspaceName={workspace.name}
        />
        <ShortcutContainerBtnItem
          userRole={userRole}
          Icon={PencilRuler}
          title="New task"
          isLoading={isNewTaskLoading}
          onClick={newTask}
        />
        <ShortcutContainerBtnItem
          userRole={userRole}
          Icon={Workflow}
          title="New mind map"
          isLoading={isNewMindMapLoading}
          onClick={newMindMap}
        />
        {userRole !== "OWNER" && <LeaveWorkspace workspace={workspace} />}
    </div>
  );
};
