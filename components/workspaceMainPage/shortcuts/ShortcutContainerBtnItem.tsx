"use client";

import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loadingState";
import { UserPermission } from "@prisma/client";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  Icon: LucideIcon;
  userRole: UserPermission | null;
  isLoading: boolean;
  onClick: () => void;
}

export const ShortcutContainerBtnItem = ({
  Icon,
  title,
  userRole,
  isLoading,
  onClick,
}: Props) => {
  return (
    <Button
      disabled={isLoading}
      onClick={onClick}
      variant={"outline"}
      className="h-9 gap-2 px-4 text-[13px]"
    >
      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          <Icon size={16} />
          <h4 className="break-words">{title}</h4>
        </>
      )}
    </Button>
  );
};
