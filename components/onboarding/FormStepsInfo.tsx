"use client";

import { useOnboardingForm } from "@/context/OnboardingForm";

const steps = [1, 2, 3, 4];

export const FormStepsInfo = () => {
  const { currentStep } = useOnboardingForm();

  return (
    <div className="mx-auto flex w-full max-w-md items-center gap-2">
      {steps.map((step) => (
        <div key={step} className="flex flex-1 items-center gap-2">
          <span
            className={`font-mono text-[9px] ${
              currentStep >= step ? "text-foreground" : "text-muted-foreground/50"
            }`}
          >
            {String(step).padStart(2, "0")}
          </span>
          <span
            className={`h-px flex-1 ${
              currentStep >= step ? "bg-foreground/50" : "bg-border"
            }`}
          />
        </div>
      ))}
    </div>
  );
};
