import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useOnboardingForm } from "@/context/OnboardingForm";
import { ActionType } from "@/types/onBoardingContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { z } from "zod";

// Schema for external service usernames
const externalServicesSchema = z.object({
  leetcodeUsername: z.string().optional(),
  codeforcesUsername: z.string().optional(),
  codechefUsername: z.string().optional(),
  githubUsername: z.string().optional(),
  redditUsername: z.string().optional(),
});

type ExternalServicesSchema = z.infer<typeof externalServicesSchema>;

export const FourthStep = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { dispatch, name, surname, profileImage, useCase, workspaceName, workspaceImage } = useOnboardingForm();
  const { toast } = useToast();
  const router = useRouter();
  const { update } = useSession();
  const t = useTranslations("ONBOARDING_FORM");

  const form = useForm<ExternalServicesSchema>({
    resolver: zodResolver(externalServicesSchema),
    defaultValues: {
      leetcodeUsername: "",
      codeforcesUsername: "",
      codechefUsername: "",
      githubUsername: "",
      redditUsername: "",
    },
  });

  const onSubmit = async (data: ExternalServicesSchema) => {
    setIsSubmitting(true);
    
    try {
      // Dispatch all the external service usernames
      if (data.leetcodeUsername) {
        dispatch({ type: ActionType.LEETCODE_USERNAME, payload: data.leetcodeUsername });
      }
      if (data.codeforcesUsername) {
        dispatch({ type: ActionType.CODEFORCES_USERNAME, payload: data.codeforcesUsername });
      }
      if (data.codechefUsername) {
        dispatch({ type: ActionType.CODECHEF_USERNAME, payload: data.codechefUsername });
      }
      if (data.githubUsername) {
        dispatch({ type: ActionType.GITHUB_USERNAME, payload: data.githubUsername });
      }
      if (data.redditUsername) {
        dispatch({ type: ActionType.REDDIT_USERNAME, payload: data.redditUsername });
      }

      // Submit onboarding data to API
      const onboardingData = {
        name,
        surname,
        profileImage,
        useCase,
        workspaceName,
        workspaceImage,
        leetcodeUsername: data.leetcodeUsername || null,
        codeforcesUsername: data.codeforcesUsername || null,
        codechefUsername: data.codechefUsername || null,
        githubUsername: data.githubUsername || null,
        redditUsername: data.redditUsername || null,
      };

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(onboardingData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error || payload?.message || "Failed to complete onboarding"
        );
      }

      toast({
        title: "Onboarding completed",
        description: "Your workspace is ready.",
      });
      await update();
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast({
        title: "Failed to complete onboarding",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <p className="eyebrow mb-3">Step 04 — Connect</p>
      <h2 className="font-display text-4xl leading-[1.05] sm:text-5xl">
        Bring your profiles.
      </h2>
      <p className="mt-3 max-w-[380px] text-sm leading-relaxed text-muted-foreground">
        Optional. Adding handles lets practice progress line up with the work
        you do elsewhere. You can add them later in settings.
      </p>

      <div className="mt-8 w-full max-w-md space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leetcodeUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    LeetCode Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-muted"
                      placeholder="Enter your LeetCode username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codeforcesUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    Codeforces Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-muted"
                      placeholder="Enter your Codeforces username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codechefUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    CodeChef Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-muted"
                      placeholder="Enter your CodeChef username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="githubUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    GitHub Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-muted"
                      placeholder="Enter your GitHub username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="redditUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    Reddit Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="bg-muted"
                      placeholder="Enter your Reddit username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => dispatch({ type: ActionType.CHANGE_SITE, payload: 3 })}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                disabled={isSubmitting}
                type="submit"
                className="flex-1 dark:text-white font-semibold"
              >
                {isSubmitting ? (
                  <div>Completing onboarding...</div>
                ) : (
                  <>
                    Finish setup
                    <ArrowRight width={18} height={18} />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};
