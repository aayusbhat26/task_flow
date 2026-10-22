import { cn } from "@/lib/utils";
import { CalendarItem } from "@/types/extended";
import dayjs, { Dayjs } from "dayjs";
import isSameOArfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useMemo } from "react";
import { CalendarTasks } from "./CalendarTasks";
dayjs.extend(isSameOArfter);
dayjs.extend(isSameOrBefore);

interface Props {
  day: Dayjs;
  monthIndex: number;
  calendarItems: CalendarItem[];
  mapIndex?: { weekIdx: number; dayIdx: number };
}

export const Day = ({ day, monthIndex, calendarItems }: Props) => {
  const isPreviousMonth = day.month() !== monthIndex;
  const isToday = day.format("DD-MM-YY") === dayjs().format("DD-MM-YY");

  const tasks = useMemo(
    () =>
      calendarItems.filter((dayInfo) => {
        if (!dayInfo.taskDate?.from) return false;
        const startDay = dayjs(dayInfo.taskDate.from).startOf("day");
        const endDay = dayInfo.taskDate.to
          ? dayjs(dayInfo.taskDate.to).startOf("day")
          : startDay;
        const currentDay = day.startOf("day");
        return currentDay.isSameOrAfter(startDay) && currentDay.isSameOrBefore(endDay);
      }),
    [day, calendarItems]
  );

  return (
    <div
      className={cn(
        "flex min-h-[88px] flex-col border-b border-r border-border p-1.5 sm:min-h-[118px] sm:p-2",
        isPreviousMonth ? "bg-muted/20 text-muted-foreground/60" : "bg-background"
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <p
          className={cn(
            "flex h-6 w-6 items-center justify-center font-mono text-[10px]",
            isToday
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          )}
        >
          {day.format("DD")}
        </p>
      </div>
      <CalendarTasks calendarItems={tasks} />
    </div>
  );
};
