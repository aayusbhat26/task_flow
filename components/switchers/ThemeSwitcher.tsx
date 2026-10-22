"use client";

import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Crown, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { effectivePlan } from "@/lib/billing";

const premiumThemes = [
  ["ocean", "Harbor"],
  ["forest", "Moss"],
  ["sunset", "Clay"],
  ["midnight", "Charcoal"],
  ["cherry", "Claret"],
  ["autumn", "Ochre"],
  ["lavender", "Iris"],
  ["arctic", "Frost"],
  ["cyber", "Terminal"],
  ["volcano", "Ember"],
] as const;

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
}

export const ThemeSwitcher = ({
  size = "default",
  variant = "default",
  alignDropdown = "center",
}: Props) => {
  const { setTheme } = useTheme();
  const t = useTranslations("COMMON");
  const { data: session } = useSession();
  const { toast } = useToast();
  const isFree =
    effectivePlan({
      plan: session?.user?.plan,
      planExpiresAt: session?.user?.planExpiresAt,
    }) === "FREE";

  const handleThemeChange = (theme: string) => {
    if (isFree && theme !== "light" && theme !== "dark" && theme !== "system") {
      toast({
        title: "A Pro theme",
        description: "This palette is available on Pro and Business plans.",
      });
      return;
    }
    setTheme(theme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          aria-label={t("THEME_HOVER")}
          title={t("THEME_HOVER")}
          className="relative"
        >
          <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Sun
            className="absolute h-[1.15rem] w-[1.15rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={alignDropdown} className="w-48">
        <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          Appearance
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          <Crown className="h-3 w-3" /> Pro palettes
        </DropdownMenuLabel>
        {premiumThemes.map(([value, label]) => (
          <DropdownMenuItem
            key={value}
            onClick={() => handleThemeChange(value)}
            className="justify-between"
          >
            {label}
            {isFree && <Crown className="h-3 w-3 text-muted-foreground" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
