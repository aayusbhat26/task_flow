"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { LoadingState } from "../ui/loadingState";
import { useChangeLocale } from "@/hooks/useChangeLocale";

interface Props {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | null;
  size?: "default" | "sm" | "lg" | "icon" | null;
  alignHover?: "center" | "start" | "end";
  alignDropdown?: "center" | "start" | "end";
  textSize?: "text-lg" | "text-base";
}

export const LocaleSwitcher = ({
  size = "default",
  variant = "default",
  alignDropdown = "center",
  textSize = "text-base",
}: Props) => {
  const locale = useLocale();
  const t = useTranslations("COMMON");
  const { isLoading, onSelectChange } = useChangeLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isLoading}
          variant={variant}
          size={size}
          className={textSize}
          aria-label={t("LANG_HOVER")}
          title={t("LANG_HOVER")}
        >
          {isLoading ? (
            <LoadingState className="mr-0" />
          ) : (
            <span className="font-mono text-xs uppercase">{locale}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={alignDropdown}>
        <DropdownMenuItem
          onClick={() => onSelectChange("en")}
          className="cursor-pointer"
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSelectChange("te")}
          className="cursor-pointer"
        >
          తెలుగు
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
