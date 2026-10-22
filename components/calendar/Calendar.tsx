"use client";

import { getMonth } from "@/lib/utils";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarGrid } from "./CalendarGrid";
import { useQuery } from "@tanstack/react-query";
import { CalendarItem } from "@/types/extended";
import { LoadingScreen } from "../common/LoadingScreen";
import { ClientError } from "../error/ClientError";

interface Props {
  userId: string;
}

export const Calendar = ({ userId }: Props) => {
  const [monthIndex, setMonthIndex] = useState(dayjs().month());
  const currMonth = useMemo(() => getMonth(monthIndex), [monthIndex]);
  const rangeStart = currMonth[0][0].date.startOf("day").toISOString();
  const rangeEnd = currMonth[5][6].date.endOf("day").toISOString();

  const changeMonthHandler = useCallback((change: "next" | "prev") => {
    if (change === "next") setMonthIndex((prev) => prev + 1);
    else setMonthIndex((prev) => prev - 1);
  }, []);

  const resetMonthHandler = useCallback(() => {
    if (monthIndex === dayjs().month()) return;
    setMonthIndex(dayjs().month());
  }, [monthIndex]);

  const {
    data: calendarItems,
    isLoading,
    isError,
  } = useQuery({
    queryFn: async () => {
      const params = new URLSearchParams({
        userId,
        from: rangeStart,
        to: rangeEnd,
      });
      const res = await fetch(`/api/calendar/get?${params}`);

      if (!res.ok) throw new Error();

      return (await res.json()) as CalendarItem[];
    },
    queryKey: ["getCalendarItems", userId, rangeStart, rangeEnd],
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) return <LoadingScreen />;

  if (isError)
    return (
      <ClientError hrefToGoOnReset="/dashboard/calendar" message={"error"} />
    );

  return (
    <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col gap-6 px-5 py-8 sm:px-8">
      <CalendarHeader
        monthIndex={monthIndex}
        onChangeMonthHandler={changeMonthHandler}
        onResetMonthHandler={resetMonthHandler}
      />
      <CalendarGrid
        currMonth={currMonth}
        monthIndex={monthIndex}
        calendarItems={calendarItems ?? []}
      />
    </div>
  );
};
