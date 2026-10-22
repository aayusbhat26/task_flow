"use client";

import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signUpSchema, SignUpSchema } from "@/schema/signUpSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProviderSignInBtns } from "./ProviderSignInBtns";
import { Input } from "../ui/input";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LoadingState } from "../ui/loadingState";
import { Eye, EyeOff } from "lucide-react";
import type { OAuthProviderAvailability } from "@/lib/auth";

export const SignUpCardContent = ({
  oauthProviders,
}: {
  oauthProviders: OAuthProviderAvailability;
}) => {
  const t = useTranslations("AUTH");
  const m = useTranslations("MESSAGES");
  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", username: "" },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const onSubmit = async (data: SignUpSchema) => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const response = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          response.error || response.message || m("ERRORS.DEFAULT")
        );
      }

      const login = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!login || login.error) {
        toast({
          title: "Account created. Please sign in to continue.",
        });
        router.push("/sign-in");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast({
        title:
          err instanceof Error ? err.message : m("ERRORS.DEFAULT"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProviderSignInBtns
        disabled={isLoading}
        onLoading={setIsLoading}
        oauthProviders={oauthProviders}
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            or use email
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-medium text-foreground">
                  {t("EMAIL")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-medium text-foreground">
                  {t("USERNAME")}
                </FormLabel>
                <FormControl>
                  <Input
                    autoComplete="username"
                    placeholder="your-handle"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-medium text-foreground">
                  {t("PASSWORD")}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 10 characters"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            disabled={isLoading}
            className="mt-2 h-10 w-full"
            type="submit"
          >
            {isLoading ? (
              <LoadingState loadingText={m("PENDING.LOADING")} />
            ) : (
              t("SIGN_UP.SUBMIT_BTN")
            )}
          </Button>

          <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
            Your workspace is private by default. You can invite collaborators
            once it&apos;s set up.
          </p>
        </form>
      </Form>
    </div>
  );
};
