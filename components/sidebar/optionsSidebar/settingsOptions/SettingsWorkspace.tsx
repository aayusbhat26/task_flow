"use client";

import ActiveLink from "@/components/ui/active-link";
import { Workspace, CustomColors } from "@prisma/client";
import Image from "next/image";
import { useMemo } from "react";
import { useLocale } from "next-intl";

interface Props {
  workspace: Workspace;
  href: string;
}

export const SettingsWorkspace = ({
  href,
  workspace: { color, id, image, name },
}: Props) => {
  const locale = useLocale();

  const workspaceColor = useMemo(() => {
    const colors: Record<CustomColors, string> = {
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
    return colors[color] ?? "bg-foreground";
  }, [color]);

  return (
    <ActiveLink
      href={`/${locale}${href}/${id}`}
      variant={"ghost"}
      size={"sm"}
      className="h-9 w-full justify-start gap-2 overflow-hidden px-2 text-[13px] text-muted-foreground"
    >
      {image ? (
        <Image
          src={image}
          priority
          className="h-6 w-6 object-cover"
          alt="workspace image"
          height={300}
          width={300}
        />
      ) : (
        <div
          className={`flex h-6 w-6 items-center justify-center text-[10px] text-white ${workspaceColor}`}
        >
          <p>{name[0].toUpperCase()}</p>
        </div>
      )}
      <p>{name}</p>
    </ActiveLink>
  );
};
