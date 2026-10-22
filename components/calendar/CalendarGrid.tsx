"use client";

import dayjs from "dayjs";
import { Fragment } from "react";
import { Day } from "./Day";
import { CalendarItem } from "@/types/extended";
import { useTranslations } from "next-intl";

interface CalendarCell {
  date: dayjs.Dayjs;
  mapIndex: { weekIdx: number; dayIdx: number };
}

interface Props {
  currMonth: CalendarCell[][];
  monthIndex: number;
  calendarItems: CalendarItem[];
}

const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const CalendarGrid = ({
  currMonth,
  monthIndex,
  calendarItems,
}: Props) => {
  const t = useTranslations("CALENDAR.DAYS_OF_WEEK");

  return (
    <div className="flex h-full w-full flex-col">
      <div className="grid w-full grid-cols-7 border-l border-t border-border">
        {daysOfWeek.map((day) => (
          <p
            key={day}
            className="border-b border-r border-border px-2 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground"
          >
            {t(day)}
          </p>
        ))}
      </div>
      <div className="grid w-full flex-1 grid-cols-7">
        {currMonth.map((row, i) => (
          <Fragment key={i}>
            {row.map((cell, idx) => (
              <Day
                key={idx}
                monthIndex={monthIndex}
                day={cell.date}
                mapIndex={cell.mapIndex}
                calendarItems={calendarItems}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
