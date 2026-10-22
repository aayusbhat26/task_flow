"use client";

import { UserPermission } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../ui/dialog";
import { Button } from "../../../ui/button";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  userRole: UserPermission | null;
  workspaceName: string;
}

const roleLabel = (role: UserPermission | null) => {
  switch (role) {
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    case "CAN_EDIT":
      return "Editor";
    case "READ_ONLY":
      return "Viewer";
    default:
      return "Member";
  }
};

export const PermissionIndicator = ({ userRole, workspaceName }: Props) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations("PERMISSION_INDICATOR");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
          {roleLabel(userRole)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">
            Your role in {workspaceName}
          </DialogTitle>
          <DialogDescription>{t("DESC", { workspace: workspaceName })}</DialogDescription>
        </DialogHeader>
        <div className="border-y border-border py-4">
          <p className="text-sm font-medium">{roleLabel(userRole)}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {userRole === "OWNER" && t("ROLES_DESC.OWNER")}
            {userRole === "ADMIN" && t("ROLES_DESC.ADMIN")}
            {userRole === "CAN_EDIT" && t("ROLES_DESC.EDITOR")}
            {userRole === "READ_ONLY" && t("ROLES_DESC.READ_ONLY")}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} type="button">
            {t("BTN")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
