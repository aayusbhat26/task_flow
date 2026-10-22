import { Workspace } from "@prisma/client";
import Link from "next/link";
import { Bottom } from "./Bottom";
import { AddWorkspace } from "./newWorkspace/AddWorkspace";
import { Top } from "./Top";
import { Workspaces } from "./workspaces/Workspaces";

interface Props {
  userWorkspaces: Workspace[];
  createdWorkspaces: number;
  refetchWorkspaces?: () => void;
  showDSA: boolean;
}

export const ShortcutSidebar = ({
  userWorkspaces,
  createdWorkspaces,
  refetchWorkspaces,
  showDSA,
}: Props) => {
  return (
    <div className="flex h-full w-[76px] shrink-0 flex-col items-center border-r border-border bg-background lg:w-[60px]">
      <Link
        href="/dashboard"
        className="flex h-14 w-full shrink-0 items-center justify-start border-b border-border pl-4 font-mono text-[10px] font-medium tracking-[0.08em] lg:justify-center lg:pl-0"
        title="TaskFlow"
        aria-label="TaskFlow home"
      >
        TF
      </Link>

      <div className="flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto py-3 no-scrollbar">
        <Top showDSA={showDSA} />
        <div className="my-1 h-px w-7 bg-border" />
        <Workspaces userWorkspaces={userWorkspaces} href="/dashboard/workspace" />
        <div className="pt-1">
          <AddWorkspace
            createdWorkspaces={createdWorkspaces}
            refetchWorkspaces={refetchWorkspaces}
          />
        </div>
      </div>

      <div className="w-full border-t border-border py-2">
        <Bottom />
      </div>
    </div>
  );
};
