"use client";

import ActiveLink from "@/components/ui/active-link";
import { Workspace } from "@prisma/client";
import { LockKeyhole, SunMoon, User2, Volume2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SettingsWorkspace } from "./SettingsWorkspace";

const settingsFields = [
  {
    href: "/dashboard/settings",
    icon: <User2 size={20} />,
    title: "SETTINGS.ACCOUNT",
  },
  {
    href: "/dashboard/settings/security",
    icon: <LockKeyhole size={20} />,
    title: "SETTINGS.SECURITY",
  },
  {
    href: "/dashboard/settings/theme",
    icon: <SunMoon size={20} />,
    title: "SETTINGS.THEME",
  },
  {
    href: "/dashboard/settings/sound",
    icon: <Volume2 size={20} />,
    title: "SETTINGS.SOUND",
  },
];

interface Props {
  userAdminWorkspaces: Workspace[];
}

export const Settings = ({ userAdminWorkspaces }: Props) => {
  const t = useTranslations("SIDEBAR");
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <p className="text-xs sm:text-sm uppercase text-muted-foreground">
          {t("SETTINGS.GENERAL")}
        </p>
        <div className="flex w-full flex-col gap-0.5">
          {settingsFields.map((settingField, i) => (
            <ActiveLink
              key={i}
              href={`/${locale}${settingField.href}`}
              variant={"ghost"}
              size={"sm"}
              className="h-8 w-full justify-start gap-2 px-2 text-[13px] text-muted-foreground"
            >
              {settingField.icon}
              {t(settingField.title)}
            </ActiveLink>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs sm:text-sm uppercase text-muted-foreground">
          {t("SETTINGS.WORKSPACE")}
        </p>
        <div className="flex w-full flex-col gap-0.5">
          {userAdminWorkspaces.map((workspace) => (
            <SettingsWorkspace
              key={workspace.id}
              href="/dashboard/settings/workspace"
              workspace={workspace}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
