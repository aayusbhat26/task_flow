"use client";
import { Tag, TaskPriority } from "@prisma/client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { taskSchema, TaskSchema } from "@/schema/taskSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";

import TextareaAutosize from "react-textarea-autosize";

import { DateRange } from "react-day-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Emoji } from "@/components/tasks/editable/container/Emoji";
import { TaskCalendar } from "@/components/tasks/editable/container/TaskCalendar";

import { TagSelector } from "../../../common/tag/TagSelector";
import { LinkTag } from "../tag/LinkTag";
import { useTranslations } from "next-intl";
import { useDebouncedCallback } from "use-debounce";
import { useAutosaveIndicator } from "@/context/AutosaveIndicator";
import axios from "axios";
import { changeCodeToEmoji } from "@/lib/changeCodeToEmoji";
import { useTags } from "@/hooks/useTags";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

const EditorTasks = dynamic(
  () => import("../editor/Editor").then((mod) => mod.EditorTasks),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);

interface Props {
  workspaceId: string;
  initialActiveTags: Tag[];
  taskId: string;
  title?: string;
  content?: JSON;
  emoji?: string;
  from?: Date;
  to?: Date;
  priority?: TaskPriority;
}

export const TaskContainer = ({
  workspaceId,
  initialActiveTags,
  taskId,
  title,
  content,
  emoji,
  from,
  to,
  priority: initialPriority = "MEDIUM",
}: Props) => {
  const [isMounted, setIsMounted] = useState(false);
  const _titleRef = useRef<HTMLTextAreaElement>(null);
  const t = useTranslations("TASK");
  const [taskDate] = useState({ from, to });
  const [priority, setPriority] = useState<TaskPriority>(initialPriority);

  const { status, onSetStatus } = useAutosaveIndicator();

  const form = useForm<TaskSchema>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      icon: emoji,
      title: title ? title : "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { ref: titleRef, ...rest } = form.register("title");

  const onFormSelectHandler = (emoji: string) => {
    form.setValue("icon", emoji);
  };

  const onUpdateFormHandler = (date: DateRange | undefined) => {
    form.setValue("date", date);
  };

  const { mutate: updateTaskTitle, isPending } = useMutation({
    mutationFn: async (title: string) => {
      await axios.post("/api/task/update/title", {
        workspaceId,
        title,
        taskId,
      });
    },
    onSuccess: () => {
      onSetStatus("saved");
    },
    onError: () => {
      onSetStatus("unsaved");
    },
  });

  const { mutate: updateTaskActiveTags } = useMutation({
    mutationFn: async (tagIds: string[]) => {
      await axios.post("/api/task/update/active_tags", {
        workspaceId,
        tagsIds: tagIds,
        taskId,
      });
    },
    onSuccess: () => {
      onSetStatus("saved");
    },
    onError: () => {
      onSetStatus("unsaved");
    },
  });

  const { mutate: updateTaskPriority } = useMutation({
    mutationFn: async (nextPriority: TaskPriority) => {
      await axios.post("/api/task/update/priority", {
        workspaceId,
        taskId,
        priority: nextPriority,
      });
    },
    onSuccess: () => onSetStatus("saved"),
    onError: () => onSetStatus("unsaved"),
  });

  const cyclePriority = () => {
    const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    const next =
      priorities[(priorities.indexOf(priority) + 1) % priorities.length];
    setPriority(next);
    onSetStatus("pending");
    updateTaskPriority(next);
  };

  const debouncedTitle = useDebouncedCallback(
    useCallback((value: string) => {
      onSetStatus("pending");
      updateTaskTitle(value);
    }, []),
    500
  );

  const debouncedCurrentActiveTags = useDebouncedCallback(() => {
    onSetStatus("pending");
    const tagsIds = currentActiveTags.map((tag) => tag.id);
    updateTaskActiveTags(tagsIds);
  }, 2000);

  const onSubmit = (data: TaskSchema) => {
    console.log(data);
  };

  const {
    currentActiveTags,
    tags,
    isError,
    isLoadingTags,
    onDeleteActiveTagHandler,
    onSelectActiveTagHandler,
    onUpdateActiveTagHandler,
  } = useTags(
    workspaceId,
    isMounted,
    initialActiveTags,
    debouncedCurrentActiveTags
  );

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <form
        id="task-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <CardContent className="flex flex-col p-6 sm:p-10">
          <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:gap-5">
            <Emoji
              onFormSelect={onFormSelectHandler}
              emoji={form.getValues("icon")}
              taskId={taskId}
              workspaceId={workspaceId}
            />
            <div className="flex w-full flex-col gap-3">
              <div>
                <p className="eyebrow mb-2">Task</p>
                <TextareaAutosize
                  {...rest}
                  ref={(e) => {
                    titleRef(e);
                    //@ts-ignore
                    _titleRef.current = e;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                  onChange={(e) => {
                    if (status !== "unsaved") onSetStatus("unsaved");
                    debouncedTitle(e.target.value);
                  }}
                  onBlur={() => {
                    debouncedTitle.flush();
                  }}
                  placeholder={t("HEADER.PLACEHOLDER")}
                  className="w-full resize-none appearance-none overflow-hidden bg-transparent font-display text-4xl leading-[1.08] placeholder:text-muted-foreground/80 focus:outline-none sm:text-5xl"
                />
              </div>
              <div className="flex w-full flex-row flex-wrap gap-1.5">
                <TaskCalendar
                  onUpdateForm={onUpdateFormHandler}
                  workspaceId={workspaceId}
                  taskId={taskId}
                  from={taskDate.from}
                  to={taskDate.to}
                />
                <TagSelector
                  isError={isError}
                  isLoading={isLoadingTags}
                  tags={tags}
                  currentActiveTags={currentActiveTags}
                  onSelectActiveTag={onSelectActiveTagHandler}
                  workspaceId={workspaceId}
                  onUpdateActiveTags={onUpdateActiveTagHandler}
                  onDeleteActiveTag={onDeleteActiveTagHandler}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs"
                  onClick={cyclePriority}
                  title="Change priority"
                >
                  <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="capitalize">{priority.toLowerCase()}</span>
                </Button>

                {currentActiveTags.map((tag) => (
                  <LinkTag key={tag.id} tag={tag} disabled />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6">
            <EditorTasks
              workspaceId={workspaceId}
              taskId={taskId}
              content={content}
            />
          </div>
        </CardContent>
      </form>
    </Card>
  );
};
