"use client";

import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";

const routeLabels: Record<string, string> = {
  dashboard: "Home",
  settings: "Settings",
  security: "Security",
  theme: "Appearance",
  sound: "Sound",
  notes: "Notes",
  pomodoro: "Pomodoro",
  calendar: "Calendar",
  starred: "Starred",
  "assigned-to-me": "Assigned to me",
  "solved-questions": "Solved questions",
  dsa: "DSA practice",
  gaming: "Achievements",
  chat: "Chat",
};

const dynamicLabels: Record<string, string> = {
  workspace: "",
  task: "Task",
  "mind-map": "Mind map",
  channel: "Channel",
  invite: "Invite",
};

interface Props {
  addManualRoutes?: {
    name: string;
    href: string;
    useTranslate?: boolean;
    emoji?: string;
  }[];
  workspaceHref?: string;
}

const titleCase = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const BreadcrumbNav = ({ addManualRoutes }: Props) => {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("ROUTES");

  const withLocale = (href: string) =>
    href.startsWith(`/${locale}`) ? href : `/${locale}${href.startsWith("/") ? href : `/${href}`}`;

  const rawSegments = pathname
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== locale)
    .filter((segment) => segment !== "workspace");

  const segments = rawSegments.filter((segment) => !/^c[a-z0-9]{20,}$/i.test(segment));

  if (addManualRoutes?.length) {
    return (
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1 text-[13px] text-muted-foreground">
          {addManualRoutes.map((route, index) => {
            const isLast = index === addManualRoutes.length - 1;
            const label = route.useTranslate ? t(route.name) : route.name;
            return (
              <li key={`${route.href}-${index}`} className="flex min-w-0 items-center gap-1">
                {!isLast ? (
                  <>
                    <Link
                      href={withLocale(route.href)}
                      className="truncate transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                  </>
                ) : (
                  <span className="truncate font-medium text-foreground">
                    {route.emoji && <span className="mr-1">{route.emoji}</span>}
                    {label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  if (segments.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-[13px] text-muted-foreground">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const label = routeLabels[segment] ?? titleCase(segment);
          const href = "/" + ["dashboard", ...segments.slice(1, index + 1)].join("/");

          if (dynamicLabels[segment] === "" && !isLast) return null;

          return (
            <li key={`${segment}-${index}`} className="flex min-w-0 items-center gap-1">
              {!isLast ? (
                <>
                  <Link
                    href={withLocale(href)}
                    className="truncate transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                </>
              ) : (
                <span className="truncate font-medium text-foreground">{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
