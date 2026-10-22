"use client";

import { LocaleSwitcher } from "@/components/switchers/LocaleSwitcher";
import ActiveLink from "@/components/ui/active-link";
import { Button } from "@/components/ui/button";
import { LogOutIcon, Settings2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

export const Bottom = () => {
  const t = useTranslations("SIDEBAR");
  const lang = useLocale();

  const logOutHandler = () => {
    signOut({ callbackUrl: `${window.location.origin}/${lang}` });
  };

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <LocaleSwitcher
        textSize="text-base"
        alignHover="start"
        alignDropdown="start"
        variant="ghost"
        size="icon"
      />
      <div className="flex flex-col items-center">
        <Button
          onClick={logOutHandler}
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          title={t("MAIN.LOG_OUT_HOVER")}
          aria-label={t("MAIN.LOG_OUT_HOVER")}
        >
          <LogOutIcon size={17} strokeWidth={1.7} />
        </Button>
        <span className="text-[8px] leading-none text-muted-foreground lg:hidden">
          {t("MAIN.LOG_OUT_HOVER")}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <ActiveLink
          include="settings"
          variant="ghost"
          size="icon"
          href={`/${lang}/dashboard/settings`}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          title={t("MAIN.SETTINGS_HOVER")}
          aria-label={t("MAIN.SETTINGS_HOVER")}
        >
          <Settings2 size={17} strokeWidth={1.7} />
        </ActiveLink>
        <span className="text-[8px] leading-none text-muted-foreground lg:hidden">
          {t("MAIN.SETTINGS_HOVER")}
        </span>
      </div>
    </div>
  );
};
