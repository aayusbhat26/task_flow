
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { effectivePlan } from "@/lib/billing";

export const useThemeManager = () => {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Enhanced theme change handler with error handling and DOM updates
  const changeTheme = useCallback(
    (newTheme: string) => {
      if (typeof window === "undefined") return;

      const freeThemes = ["light", "dark", "system"];
      const plan = effectivePlan({
        plan: session?.user?.plan,
        planExpiresAt: session?.user?.planExpiresAt,
      });

      if (!freeThemes.includes(newTheme) && plan === "FREE") {
        toast({
          title: "A Pro palette",
          description:
            "All ten palettes are included with Pro and Business. Your current theme is unchanged.",
        });
        return;
      }

      try {
        setTheme(newTheme);
        window.dispatchEvent(
          new CustomEvent("themeChanged", {
            detail: { theme: newTheme },
          })
        );
      } catch (error) {
        console.error("Failed to change theme:", error);
      }
    },
    [setTheme, session?.user?.plan, session?.user?.planExpiresAt, toast]
  );

  // Get the current active theme (handles system theme properly)
  const currentTheme = mounted ? (theme === "system" ? systemTheme : theme) : "light";

  // Get the effective theme for UI display
  const displayTheme = mounted ? (theme || resolvedTheme || "light") : "light";

  return {
    theme,
    resolvedTheme,
    systemTheme,
    currentTheme,
    displayTheme,
    changeTheme,
    mounted,
    isSystemTheme: theme === "system"
  };
};
