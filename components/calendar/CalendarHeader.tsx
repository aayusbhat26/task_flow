"use client";

import { useFormatter, useTranslations } from "next-intl";
import dayjs from "dayjs";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  monthIndex: number;
  onResetMonthHandler: () => void;
  onChangeMonthHandler: (change: "next" | "prev") => void;
}

export const CalendarHeader = ({
  monthIndex,
  onChangeMonthHandler,
  onResetMonthHandler,
}: Props) => {
  const format = useFormatter();
  const t = useTranslations("CALENDAR.HEADER");

  const dateTime = new Date(dayjs().year(), monthIndex);

  const year = format.dateTime(dateTime, { year: "numeric" });
  const month = format.dateTime(dateTime, { month: "long" });

  return (
    <div className="flex w-full flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="eyebrow">Schedule</p>
        <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">
          {month} <span className="text-muted-foreground">{year}</span>
        </h1>
      </div>
      <div className="flex items-center">
        <Button
          onClick={() => onChangeMonthHandler("prev")}
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-none border-r-0"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          onClick={onResetMonthHandler}
          variant="outline"
          className="h-9 rounded-none border-r-0 px-3 text-xs"
        >
          {t("TODAY")}
        </Button>
        <Button
          onClick={() => onChangeMonthHandler("next")}
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-none"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
