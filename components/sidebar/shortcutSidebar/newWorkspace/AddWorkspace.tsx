"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AddWorkspaceForm } from "./AddWorkspaceForm";
import Warning from "@/components/ui/warning";
import { CreatedWorkspacesInfo } from "@/components/common/CreatedWorkspacesInfo";

interface Props {
  createdWorkspaces: number;
  refetchWorkspaces?: () => void;
}

export const AddWorkspace = ({ createdWorkspaces, refetchWorkspaces }: Props) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations("SIDEBAR");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 border border-dashed border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
          title={t("MAIN.NEW_WORKSPACE_HOVER")}
          aria-label={t("MAIN.NEW_WORKSPACE_HOVER")}
        >
          <Plus size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">
            {t("MAIN.NEW_WORKSPACE_DIALOG_TITLE")}
          </DialogTitle>
          <DialogDescription>
            A workspace keeps its people, tasks and notes together.
          </DialogDescription>
        </DialogHeader>
        <Warning className="hidden sm:flex" blue>
          <CreatedWorkspacesInfo
            className="text-left text-secondary-foreground"
            createdNumber={createdWorkspaces}
          />
        </Warning>
        <AddWorkspaceForm
          onSetOpen={setOpen}
          refetchWorkspaces={refetchWorkspaces}
        />
      </DialogContent>
    </Dialog>
  );
};
