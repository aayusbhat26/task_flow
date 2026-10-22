"use client";

import { CalendarItem } from "@/types/extended";
import { CustomColors } from "@prisma/client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface Props {
  dayInfo: CalendarItem;
  showMore?: boolean;
}

const colorMap: Record<CustomColors, string> = {
  PURPLE: "bg-[#5c4a6b]",
  GREEN: "bg-[#46624a]",
  RED: "bg-[#7d3f3f]",
  BLUE: "bg-[#415a77]",
  CYAN: "bg-[#3f6266]",
  EMERALD: "bg-[#3f6150]",
  INDIGO: "bg-[#464f73]",
  LIME: "bg-[#69703a]",
  ORANGE: "bg-[#965d3b]",
  FUCHSIA: "bg-[#744a63]",
  PINK: "bg-[#8f5560]",
  YELLOW: "bg-[#8a7131]",
};

export const CalendarTask = ({ dayInfo }: Props) => {
  const {
    taskId,
    title,
    workspaceColor,
    workspaceId,
    workspaceName,
  } = dayInfo;
  const t = useTranslations("CALENDAR");
  const locale = useLocale();

  return (
    <Link
      href={`/${locale}/dashboard/workspace/${workspaceId}/tasks/task/${taskId}`}
      title={`${title || t("TASK")} · ${workspaceName}`}
      className="flex items-center gap-1.5 px-1 py-0.5 text-[10px] leading-tight transition-colors hover:bg-secondary sm:text-[11px]"
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 ${colorMap[workspaceColor] ?? "bg-primary"}`}
      />
      <span className="truncate">{title || t("TASK")}</span>
    </Link>
  );
};
