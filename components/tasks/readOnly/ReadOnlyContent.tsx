"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ExtendedTask } from "@/types/extended";
import { UserPermission } from "@prisma/client";
import { useFormatter, useTranslations } from "next-intl";
import { ReadOnlyEmoji } from "../../common/ReadOnlyEmoji";
import { useState } from "react";
import { Star } from "lucide-react";
import { TaskOptions } from "./TaskOptions";
import { ReadOnlyCalendar } from "./ReadOnlyCalendar";
import { LinkTag } from "../editable/tag/LinkTag";
import { UserHoverInfo } from "@/components/common/UserHoverInfoCard";
import { Separator } from "@/components/ui/separator";
import { AssignedToTaskSelector } from "../assignToTask/AssignedToTaskSelector";
import { TaskCompleteButton } from "../TaskCompleteButton";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/common/LoadingScreen";

const ReadOnlyContentRenderer = dynamic(
  () => import("./ReadOnlyContentRenderer").then((mod) => mod.ReadOnlyContentRenderer),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);

interface Props {
  task: ExtendedTask;
  isSavedByUser: boolean;
  userRole: UserPermission | null;
}

export const ReadOnlyContent = ({ task, isSavedByUser, userRole }: Props) => {
  const [isSaved, setisSaved] = useState(isSavedByUser);
  const t = useTranslations("TASK.EDITOR.READ_ONLY");
  const [updater] = useState(task.updatedBy);

  const format = useFormatter();
  const dateTime = new Date(task.updatedAt);
  const now = new Date();

  const onSetIsSaved = () => {
    setisSaved((prev) => !prev);
  };
  return (
    <Card className="relative mx-auto w-full max-w-4xl">
      <CardContent className="flex flex-col p-6 sm:p-10">
        <div className="flex w-full items-start gap-4">
          <ReadOnlyEmoji selectedEmoji={task.emoji} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-2">Task</p>
            <div className="flex items-start justify-between gap-4">
              <h1 className="flex items-center gap-2 font-display text-4xl leading-[1.08] sm:text-5xl">
                {task.title ? task.title : t("NO_TITLE")}
                {isSaved && <Star className="h-5 w-5 text-primary" />}
              </h1>
              <div className="shrink-0">
                <TaskOptions
                  onSetIsSaved={onSetIsSaved}
                  isSaved={isSaved}
                  taskId={task.id}
                  workspaceId={task.workspaceId}
                  userRole={userRole}
                />
              </div>
            </div>

            <div className="mt-5 flex w-full flex-row flex-wrap items-center gap-1.5 border-t border-border pt-4">
              {userRole && userRole !== "READ_ONLY" && (
                <TaskCompleteButton
                  taskId={task.id}
                  workspaceId={task.workspaceId}
                  isCompleted={task.isCompleted}
                  className={task.isCompleted ? "pointer-events-none" : ""}
                />
              )}
              <AssignedToTaskSelector
                taskId={task.id}
                workspaceId={task.workspaceId}
              />
              <ReadOnlyCalendar
                from={task.taskDate?.from ? new Date(task.taskDate.from) : undefined}
                to={task.taskDate?.to ? new Date(task.taskDate.to) : undefined}
              />
              {task.tags &&
                task.tags.map((tag) => <LinkTag key={tag.id} tag={tag} />)}
            </div>
          </div>
        </div>

        <div className="mt-8 w-full border-t border-border pt-6">
          <ReadOnlyContentRenderer content={task.content as any} />
        </div>
      </CardContent>
      <CardFooter className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-6 py-4 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground sm:px-10">
        <div className="flex items-center gap-1">
          <span>{t("CREATOR_INFO")}</span>
          <UserHoverInfo user={task.creator} />
        </div>
        <Separator className="hidden h-3 sm:block" orientation="vertical" />
        <div className="flex items-center gap-1">
          <span>{t("EDITOR_INFO")}</span>
          <UserHoverInfo user={updater} />
          <span>{format.relativeTime(dateTime, now)}</span>
        </div>
      </CardFooter>
    </Card>
  );
};
