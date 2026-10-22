"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { LocaleSwitcher } from "@/components/switchers/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/switchers/ThemeSwitcher";
import { useOnboardingForm } from "@/context/OnboardingForm";
import { FirstStep } from "../onboarding/steps/FirstStep";
import { SecondStep } from "../onboarding/steps/SecondStep";
import { ThirdStep } from "../onboarding/steps/ThirdStep";
import { FourthStep } from "../onboarding/steps/FourthStep";
import { FormStepsInfo } from "./FormStepsInfo";

interface Props {
  profileImage?: string | null;
}

const stepNames = ["Profile", "Use", "Workspace", "Connect"];

export const AdditionalInfoSection = ({ profileImage }: Props) => {
  const { currentStep } = useOnboardingForm();
  const locale = useLocale();

  return (
    <section className="flex min-h-dvh w-full flex-col bg-background lg:w-1/2">
      <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-10">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center border border-foreground/70 font-mono text-[10px] font-medium">
            TF
          </span>
          <span className="font-display text-xl leading-none">TaskFlow</span>
        </Link>
        <div className="flex items-center gap-1">
          <LocaleSwitcher
            alignHover="end"
            alignDropdown="end"
            size="icon"
            variant="ghost"
          />
          <ThemeSwitcher
            alignHover="end"
            alignDropdown="end"
            size="icon"
            variant="ghost"
          />
        </div>
      </header>

      <div className="flex flex-1 justify-center px-5 py-10 sm:px-10 lg:items-center lg:py-12">
        <div className="w-full max-w-md">
          {currentStep === 1 && <FirstStep profileImage={profileImage} />}
          {currentStep === 2 && <SecondStep />}
          {currentStep === 3 && <ThirdStep />}
          {currentStep === 4 && <FourthStep />}
        </div>
      </div>

      <footer className="border-t border-border px-5 py-5 sm:px-10">
        <FormStepsInfo />
      </footer>
    </section>
  );
};
