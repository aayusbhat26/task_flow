"use client";

import ActiveLink from "@/components/ui/active-link";
import { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface Props {
  href: string;
  Icon: LucideIcon;
  hoverTextKey: string;
  include?: string;
}

export const SidebarLink = ({ hoverTextKey, href, Icon, include }: Props) => {
  const t = useTranslations("SIDEBAR.MAIN");
  const locale = useLocale();
  const label = t(hoverTextKey);
  const mobileLabel = label.split(" & ")[0];

  return (
    <ActiveLink
      include={include}
      variant="ghost"
      size="icon"
      href={`/${locale}${href}`}
      title={label}
      aria-label={label}
      className="h-auto w-full flex-col gap-1 py-2 text-muted-foreground hover:text-foreground lg:h-9 lg:w-9 lg:gap-0 lg:p-0"
    >
      <Icon size={17} strokeWidth={1.7} />
      <span className="max-w-full truncate text-[8px] leading-none tracking-[0.02em] lg:hidden">
        {mobileLabel}
      </span>
    </ActiveLink>
  );
};
