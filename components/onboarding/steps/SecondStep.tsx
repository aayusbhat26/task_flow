import { Button } from "@/components/ui/button";
import { useOnboardingForm } from "@/context/OnboardingForm";
import { ActionType } from "@/types/onBoardingContext";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

const useCases = [
  {
    case: "STUDY",
    title: "SECOND_STEP.STUDY",
  },
];

export const SecondStep = () => {
  const { currentStep, dispatch } = useOnboardingForm();
  const [selectedUseCase, setSelectedUseCase] = useState<string>("STUDY");
  const t = useTranslations("ONBOARDING_FORM");

  // Auto-select STUDY on component mount
  useEffect(() => {
    dispatch({ type: ActionType.USECASE, payload: "STUDY" });
  }, [dispatch]);

  const handleUseCaseSelect = (useCase: string) => {
    setSelectedUseCase(useCase);
    dispatch({ type: ActionType.USECASE, payload: useCase });
  };

  const handleSubmit = () => {
    if (selectedUseCase) {
      dispatch({ type: ActionType.CHANGE_SITE, payload: currentStep + 1 });
    }
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center gap-4 w-full mt-10 text-center">
        <h2 className="font-bold text-4xl md:text-5xl  max-w-xs">
          <span className="text-primary font-semibold">TaskFlow</span>
        </h2>
        <p className="max-w-lg text-muted-foreground">
          {t("SECOND_STEP.INFO")}
        </p>
      </div>

      <div className="max-w-md w-full space-y-8 mt-14">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Select your use case</h3>

          <div className="flex flex-col space-y-3">
            {useCases.map((useCase) => (
              <div
                key={useCase.case}
                className={`flex items-center space-x-3 p-4 rounded-md transition-colors duration-200 cursor-pointer border-2 ${
                  selectedUseCase === useCase.case
                    ? "bg-primary/20 border-primary"
                    : "bg-muted/50 border-transparent hover:bg-muted/80"
                }`}
                onClick={() => handleUseCaseSelect(useCase.case)}
              >
                <input
                  type="radio"
                  name="useCase"
                  value={useCase.case}
                  checked={selectedUseCase === useCase.case}
                  onChange={() => handleUseCaseSelect(useCase.case)}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <label className="flex-1 text-left cursor-pointer font-medium">
                  {t(useCase.title)}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="mt-10 w-full max-w-md dark:text-white font-semibold"
        >
          {t("NEXT_BTN")}
          <ArrowRight width={18} height={18} />
        </Button>
      </div>
    </>
  );
};
