"use client";

import { useState } from "react";
import { Check, Crown, Globe, LogOut, Moon, Settings2, Sun, Laptop, ArrowUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { UserAvatar } from "../ui/user-avatar";
import { useTheme } from "next-themes";
import { useChangeLocale } from "@/hooks/useChangeLocale";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { getUserDisplayName } from "@/lib/userUtils";
import { cn } from "@/lib/utils";
import { effectivePlan } from "@/lib/billing";

interface Props {
  profileImage?: string | null;
  username: string;
  email: string;
  name?: string | null;
  surname?: string | null;
}

const themeOptions = [
  { value: "light", label: "Paper", icon: Sun },
  { value: "dark", label: "Evening", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

const locales = [
  { value: "en", label: "English" },
  { value: "te", label: "తెలుగు" },
];

export const User = ({ profileImage, username, email, name, surname }: Props) => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { onSelectChange } = useChangeLocale();
  const lang = useLocale();
  const t = useTranslations("COMMON");
  const { data: session } = useSession();

  const user = { name, surname, username, email, image: profileImage };
  const displayName = getUserDisplayName(user);
  const initials = displayName.charAt(0).toUpperCase();
  const plan = effectivePlan({
    plan: session?.user?.plan,
    planExpiresAt: session?.user?.planExpiresAt,
  });
  const isPro = plan !== "FREE";

  const logOutHandler = () => {
    signOut({
      callbackUrl: `${window.location.origin}/${lang}`,
    });
  };

  const chooseTheme = (value: string) => {
    setTheme(value);
    setOpen(false);
  };

  const chooseLocale = (value: string) => {
    setOpen(false);
    onSelectChange(value);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open profile menu"
          className="ml-1 rounded-full ring-offset-background transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
        >
          <UserAvatar
            className="h-8 w-8"
            profileImage={profileImage}
            fallbackText={initials}
            userId={username || email}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[292px] overflow-hidden p-0"
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <UserAvatar
            className="h-10 w-10 shrink-0"
            profileImage={profileImage}
            fallbackText={initials}
            userId={username || email}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-tight">
              {displayName}
            </p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              {email}
            </p>
          </div>
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em]",
              isPro
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            )}
          >
            {isPro && <Crown className="h-2.5 w-2.5" />}
            {plan.toLowerCase()}
          </span>
        </div>

        <DropdownMenuSeparator className="mx-0 my-0" />

        <div className="px-4 py-3.5">
          <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
            Appearance
          </p>
          <div className="mt-2 grid grid-cols-3 gap-px border border-border bg-border">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => chooseTheme(option.value)}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 py-2.5 text-[10px] transition-colors duration-150",
                    active
                      ? "bg-secondary text-foreground"
                      : "bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5",
                      active && "text-primary"
                    )}
                    strokeWidth={1.6}
                  />
                  {option.label}
                  <span
                    className={cn(
                      "h-0.5 w-3 rounded-full transition-colors",
                      active ? "bg-primary" : "bg-transparent"
                    )}
                  />
                </button>
              );
            })}
          </div>
          <Link
            href={`/${lang}/dashboard/settings/theme`}
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>All palettes</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <DropdownMenuSeparator className="mx-0 my-0" />

        <div className="px-4 py-3.5">
          <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
            <Globe className="h-3 w-3" />
            Language
          </p>
          <div className="mt-2 grid grid-cols-2 gap-px border border-border bg-border">
            {locales.map((locale) => (
              <button
                key={locale.value}
                type="button"
                onClick={() => chooseLocale(locale.value)}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 text-[11px] transition-colors",
                  lang === locale.value
                    ? "bg-secondary text-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {locale.label}
                {lang === locale.value && <Check className="h-3 w-3 text-primary" />}
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator className="mx-0 my-0" />

        <div className="p-1.5">
          <DropdownMenuItem asChild className="cursor-pointer px-2.5 py-2">
            <Link href={`/${lang}/upgrade`} className="flex w-full items-center gap-2.5">
              <Crown className="h-4 w-4 text-primary" />
              <span className="flex-1 text-[13px]">
                {isPro ? "Billing & plan" : "Go Premium"}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer px-2.5 py-2">
            <Link
              href={`/${lang}/dashboard/settings`}
              className="flex w-full items-center gap-2.5"
            >
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-[13px]">{t("SETTINGS")}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="mx-0.5 my-1" />

          <DropdownMenuItem
            onSelect={logOutHandler}
            className="cursor-pointer px-2.5 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-[13px]">{t("LOG_OUT")}</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
