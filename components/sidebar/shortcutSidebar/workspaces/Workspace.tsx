"use client";

import ActiveLink from "@/components/ui/active-link";
import { Workspace, CustomColors } from "@prisma/client";
import Image from "next/image";
import { useLocale } from "next-intl";

interface Props {
  workspace: Workspace;
  href: string;
}

const colorClasses: Record<CustomColors, string> = {
  BLUE: "bg-[#415a77]",
  EMERALD: "bg-[#3f6150]",
  LIME: "bg-[#69703a]",
  ORANGE: "bg-[#965d3b]",
  PINK: "bg-[#8f5560]",
  YELLOW: "bg-[#8a7131]",
  RED: "bg-[#7d3f3f]",
  PURPLE: "bg-[#5c4a6b]",
  GREEN: "bg-[#46624a]",
  CYAN: "bg-[#3f6266]",
  INDIGO: "bg-[#464f73]",
  FUCHSIA: "bg-[#744a63]",
};

export const WorkspaceComponent = ({
  workspace: { id, image, name, color },
  href,
}: Props) => {
  const locale = useLocale();
  const workspaceColor = colorClasses[color] ?? colorClasses.BLUE;

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <ActiveLink
        include={`${href}/${id}`}
        workspaceIcon
        className={`h-9 w-9 text-[11px] font-medium text-white ${
          image ? "border border-border" : workspaceColor
        }`}
        variant={image ? "ghost" : "default"}
        href={`/${locale}${href}/${id}`}
        size="icon"
        title={name}
        aria-label={name}
      >
        {image ? (
          <Image
            priority
            className="h-full w-full object-cover"
            src={image}
            alt=""
            height={80}
            width={80}
          />
        ) : (
          <span>{name[0]?.toUpperCase()}</span>
        )}
      </ActiveLink>
      <span className="w-full truncate px-1 text-center text-[8px] leading-none text-muted-foreground lg:hidden">
        {name}
      </span>
    </div>
  );
};
