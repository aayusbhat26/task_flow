"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { CheckCircle, LoaderCircle } from "lucide-react";
import { useCompleteTask } from "@/hooks/useCompleteTask";
import { playTaskCompletionSound } from "@/lib/soundEffects";
import { useUserSettings } from "@/hooks/useUserSettings";

interface TaskCompleteButtonProps {
  taskId: string;
  workspaceId: string;
  isCompleted?: boolean;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const TaskCompleteButton = ({
  taskId,
  workspaceId,
  isCompleted = false,
  disabled = false,
  variant = "outline",
  size = "sm",
  className,
}: TaskCompleteButtonProps) => {
  const completeTaskMutation = useCompleteTask();
  const { userSettings } = useUserSettings();
  const [completed, setCompleted] = useState(isCompleted);

  useEffect(() => {
    setCompleted(isCompleted);
  }, [isCompleted]);

  useEffect(() => {
    if (completeTaskMutation.isSuccess) setCompleted(true);
  }, [completeTaskMutation.isSuccess]);

  const handleComplete = () => {
    if (completed || disabled) return;
    
    // Play sound before making the API call for immediate feedback
    playTaskCompletionSound(undefined, userSettings?.soundsEnabled ?? true);
    
    completeTaskMutation.mutate({
      taskId,
      workspaceId,
    });
  };

  if (completed) {
    return (
      <span
        className={`inline-flex h-8 items-center gap-2 border border-primary/25 bg-primary/10 px-3 text-xs font-medium text-primary ${
          className ?? ""
        }`}
      >
        <CheckCircle className="h-4 w-4" />
        Completed
      </span>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleComplete}
      disabled={disabled || completeTaskMutation.isPending}
      className={className}
    >
      {completeTaskMutation.isPending ? (
        <>
          <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
          Completing...
        </>
      ) : completed ? (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          Completed
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete (+20 pts)
        </>
      )}
    </Button>
  );
};
