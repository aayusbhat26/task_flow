"use client";

import { Button } from "@/components/ui/button";
import { useOnboardingForm } from "@/context/OnboardingForm";
import { ActionType } from "@/types/onBoardingContext";
import { ArrowRight, BookOpen, ListTodo, Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect } from "react";

export const SecondStep = () => {
  const { currentStep, dispatch } = useOnboardingForm();
  const t = useTranslations("ONBOARDING_FORM");

  useEffect(() => {
    dispatch({ type: ActionType.USECASE, payload: "STUDY" });
  }, [dispatch]);

  return (
    <div>
      <p className="eyebrow mb-3">Step 02 — Use</p>
      <h2 className="font-display text-4xl leading-[1.05] sm:text-5xl">
        Set up for study.
      </h2>
      <p className="mt-3 max-w-[380px] text-sm leading-relaxed text-muted-foreground">
        This workspace comes shaped around study: practice tracking, notes and
        a timer for focused sessions. The layout stays out of the way.
      </p>

      <div className="mt-8 border-y border-border">
        {[
          {
            icon: BookOpen,
            title: "Practice tracking",
            detail: "Questions by topic and difficulty",
          },
          {
            icon: ListTodo,
            title: "Tasks and notes",
            detail: "One place for the work around the work",
          },
          {
            icon: Timer,
            title: "Focus rounds",
            detail: "A timer that keeps the hour honest",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 border-b border-border py-4 last:border-b-0"
          >
            <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-[13px] font-medium">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={() =>
          dispatch({ type: ActionType.CHANGE_SITE, payload: currentStep + 1 })
        }
        className="mt-8 h-10 w-full"
      >
        {t("NEXT_BTN")}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
