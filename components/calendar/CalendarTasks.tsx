"use client";

import { CalendarItem } from "@/types/extended";
import { CalendarTask } from "./CalendarTask";

interface Props {
  calendarItems: CalendarItem[];
}

export const CalendarTasks = ({ calendarItems }: Props) => {
  const visibleItems = calendarItems.slice(0, 3);

  if (calendarItems.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5">
      {visibleItems.map((calendarItem) => (
        <CalendarTask key={calendarItem.taskId} dayInfo={calendarItem} />
      ))}
      {calendarItems.length > visibleItems.length && (
        <p className="px-1 font-mono text-[9px] text-muted-foreground">
          +{calendarItems.length - visibleItems.length} more
        </p>
      )}
    </div>
  );
};
