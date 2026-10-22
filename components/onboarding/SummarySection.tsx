"use client";

import { useOnboardingForm } from "@/context/OnboardingForm";
import { UserAvatar } from "../ui/user-avatar";

export const SummarySection = () => {
  const { name, useCase, workspaceName, currentStep, profileImage } =
    useOnboardingForm();

  const step = Math.min(currentStep, 4);

  return (
    <section className="relative hidden min-h-dvh flex-col justify-between overflow-hidden bg-foreground p-12 text-background lg:flex lg:w-1/2">
      <div className="absolute inset-0 hairline-grid opacity-[0.06]" />

      <div className="relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-background/50">
          Setting the desk
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-[420px]">
        <blockquote className="font-display text-4xl leading-[1.08] text-background">
          “Everything you need for the work, and nothing that gets in the way.”
        </blockquote>

        <div className="mt-10 border border-background/25 bg-background/[0.04]">
          <div className="flex items-center justify-between border-b border-background/20 px-5 py-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-background/50">
              Workspace preview
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-background/50">
              Step {String(step).padStart(2, "0")} / 04
            </span>
          </div>

          <div className="flex items-center gap-4 px-5 py-6">
            <UserAvatar
              className="h-12 w-12 shrink-0 border border-background/30"
              size={22}
              profileImage={profileImage}
              fallbackText={name ? name.charAt(0).toUpperCase() : undefined}
            />
            <div className="min-w-0">
              <p className="truncate font-display text-2xl leading-none text-background">
                {name || "Your name"}
              </p>
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-background/50">
                {useCase === "STUDY" ? "Set up for study" : "Member"}
              </p>
            </div>
          </div>

          <div className="border-t border-background/20">
            <div className="flex items-center justify-between border-b border-background/10 px-5 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-background/45">
                Workspace
              </span>
              <span className="max-w-[220px] truncate text-sm text-background/85">
                {workspaceName || "Not named yet"}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-background/45">
                Privacy
              </span>
              <span className="text-sm text-background/85">Private by default</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-background/40">
          TaskFlow · 2026
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((number) => (
            <span
              key={number}
              className={`h-1 w-6 ${
                number <= step ? "bg-background/70" : "bg-background/20"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
