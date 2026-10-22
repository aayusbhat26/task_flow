"use client";

import { Crown, Laptop, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { LoadingState } from "@/components/ui/loadingState";
import { useThemeManager } from "@/hooks/useThemeManager";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { effectivePlan } from "@/lib/billing";

const essentials = [
  {
    value: "light",
    label: "Paper",
    description: "Warm paper, ink text, claret accent.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Evening",
    description: "Deep charcoal with an ember accent.",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow the device setting.",
    icon: Laptop,
  },
];

const palettes = [
  {
    value: "ocean",
    label: "Harbor",
    description: "Cool paper, slate blue.",
    swatches: ["#edf1f4", "#203242", "#4d6f88"],
  },
  {
    value: "forest",
    label: "Moss",
    description: "Warm paper, quiet green.",
    swatches: ["#f1f2e9", "#2b3a2c", "#5d7054"],
  },
  {
    value: "sunset",
    label: "Clay",
    description: "Ochre paper, burnt orange.",
    swatches: ["#f6ede1", "#3a2a1d", "#a2562f"],
  },
  {
    value: "midnight",
    label: "Charcoal",
    description: "Deep ink, amber light.",
    swatches: ["#1a1713", "#e5d8c3", "#c99a52"],
  },
  {
    value: "cherry",
    label: "Claret",
    description: "Soft red paper, oxblood.",
    swatches: ["#f6eaea", "#361f20", "#8a3b40"],
  },
  {
    value: "autumn",
    label: "Ochre",
    description: "Golden paper, dark gold.",
    swatches: ["#f5efdc", "#332b18", "#8a6a22"],
  },
  {
    value: "lavender",
    label: "Iris",
    description: "Cool paper, muted violet.",
    swatches: ["#f1eef4", "#2b2433", "#605073"],
  },
  {
    value: "arctic",
    label: "Frost",
    description: "Blue-grey paper, glacier.",
    swatches: ["#eef3f4", "#223036", "#4e6a72"],
  },
  {
    value: "cyber",
    label: "Terminal",
    description: "Near-black, quiet green.",
    swatches: ["#121813", "#dce5d8", "#7d997a"],
  },
  {
    value: "volcano",
    label: "Ember",
    description: "Dark rust, warm grey.",
    swatches: ["#1c1613", "#e8dcd0", "#b06046"],
  },
];

export const Theme = () => {
  const { theme, changeTheme, mounted } = useThemeManager();
  const { data: session } = useSession();
  const { toast } = useToast();
  const locale = useLocale();
  const plan = effectivePlan({
    plan: session?.user?.plan,
    planExpiresAt: session?.user?.planExpiresAt,
  });
  const isFree = plan === "FREE";

  const onSelect = (value: string, isPro: boolean) => {
    if (isFree && isPro) {
      toast({
        title: "A Pro palette",
        description:
          "Pro and Business plans include the full collection. Your current theme is unchanged.",
      });
      return;
    }
    changeTheme(value);
  };

  if (!mounted) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <LoadingState className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 py-8 sm:px-8 sm:py-10">
      <div className="border-b border-border pb-6">
        <p className="eyebrow">Appearance</p>
        <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
          Choose your paper.
        </h1>
        <p className="mt-3 max-w-[520px] text-[13px] leading-relaxed text-muted-foreground">
          Three essentials come with every workspace. Pro palettes shift the
          paper, ink and one accent — never more than that.
        </p>
      </div>

      <section className="mt-8">
        <p className="eyebrow mb-3">Essentials</p>
        <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
          {essentials.map((item) => {
            const Icon = item.icon;
            const active = theme === item.value;

            return (
              <button
                key={item.value}
                onClick={() => onSelect(item.value, false)}
                className={`flex flex-col items-start gap-4 p-5 text-left transition-colors ${
                  active ? "bg-secondary" : "bg-card hover:bg-secondary/50"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
                  {active && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-primary">
                      Active
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-medium">{item.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="eyebrow">Pro palettes</p>
          {isFree ? (
            <Link
              href={`/${locale}/upgrade`}
              className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-primary transition-opacity hover:opacity-70"
            >
              <Crown className="h-3 w-3" />
              Unlock all palettes
            </Link>
          ) : (
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              Included in {plan === "BUSINESS" ? "Business" : "Pro"}
            </span>
          )}
        </div>

        <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {palettes.map((palette) => {
            const active = theme === palette.value;
            const locked = isFree;

            return (
              <button
                key={palette.value}
                type="button"
                onClick={() => onSelect(palette.value, true)}
                aria-pressed={active}
                className={`group flex flex-col text-left transition-[background-color,transform] duration-200 active:scale-[0.995] ${
                  active ? "bg-secondary" : "bg-card hover:bg-secondary/50"
                }`}
              >
                <div className="flex h-20 w-full overflow-hidden">
                  {palette.swatches.map((color, index) => (
                    <span
                      key={color}
                      className="h-full flex-1 transition-transform duration-500 group-hover:scale-y-105"
                      style={{
                        backgroundColor: color,
                        flexGrow: index === 0 ? 1.7 : 1,
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-[13px] font-medium">{palette.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {palette.description}
                    </p>
                  </div>
                  {active ? (
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-primary">
                      Active
                    </span>
                  ) : locked ? (
                    <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                      <Crown className="h-3 w-3" />
                      Pro
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
