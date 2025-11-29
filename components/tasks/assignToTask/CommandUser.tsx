"use client";

import { Button } from "@/components/ui/button";
import { CommandItem } from "@/components/ui/command";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AssignedToTaskUser } from "@/types/extended";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface Props {
  user: AssignedToTaskUser;
  taskId: string;
  workspaceId: string;
  canEdit: boolean;
}

export const CommandUser = ({ user, taskId, workspaceId, canEdit }: Props) => {
  const [isActiveUser, setIsActiveUser] = useState(
    user.user.assignedToTask.length === 1 ? true : false
  );

  const m = useTranslations("MESSAGES");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: handleTaskAssignment } = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/assigned_to/tasks/assign`, {
        taskId,
        workspaceId,
        assignToUserId: user.user.id,
      });
    },
    onMutate: async () => {
      //@ts-ignore
      await queryClient.cancelQueries(["getAssignedToTaskInfo"]);

      setIsActiveUser((prev) => !prev);
    },
    onError: (err: AxiosError) => {
      setIsActiveUser((prev) => !prev);
      const error = err?.response?.data ? err.response.data : "ERRORS_DEFAULT";

      toast({
        title: m(error),
        variant: "destructive",
      });
    },
    onSettled: () => {
      //@ts-ignore
      queryClient.invalidateQueries(["getAssignedToTaskInfo", taskId]);
    },
    mutationKey: ["handleTaskAssignment", taskId],
  });

  return (
    <CommandItem
      value={user.user.username}
      keywords={[user.user.username]}
      onSelect={() => {
        if (canEdit) {
          handleTaskAssignment();
        } else {
          toast({
            title: "Permission Denied",
            description: "You do not have permission to assign tasks in this workspace.",
            variant: "destructive",
          });
        }
      }}
      disabled={false}
      className={cn("p-2 cursor-pointer", !canEdit && "opacity-50 cursor-not-allowed")}
    >
      <div
        className="flex items-center justify-between w-full"
        onClick={(e) => {
          // Fallback click handler in case onSelect doesn't fire
          if (canEdit) {
            e.stopPropagation();
            handleTaskAssignment();
          }
        }}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <UserAvatar
            profileImage={user.user.image}
            className="w-8 h-8"
            size={10}
          />
          <p className="text-secondary-foreground text-xs">{user.user.username}</p>
        </div>

        {isActiveUser && <Check className="text-primary pointer-events-none" size={16} />}
      </div>
    </CommandItem>
  );
};
