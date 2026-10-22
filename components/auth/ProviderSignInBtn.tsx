"use client";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { useLocale } from "next-intl";
import { useProviderLoginError } from "@/hooks/useProviderLoginError";
import { useToast } from "@/hooks/use-toast";
import { signIn } from "next-auth/react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  providerName: "google" | "github";
  configured: boolean;
  onLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ProviderSignInBtn = ({
  children,
  providerName,
  configured,
  onLoading,
  ...props
}: Props) => {
  const [showLoggedInfo, setShowLoggedInfo] = useState(false);
  const locale = useLocale();
  const { toast } = useToast();
  useProviderLoginError(showLoggedInfo);

  const signInHandler = async () => {
    if (!configured) {
      const provider = providerName === "google" ? "Google" : "GitHub";
      const envPrefix = providerName.toUpperCase();
      toast({
        title: `${provider} sign-in is not configured`,
        description: `Add ${envPrefix}_CLIENT_ID and ${envPrefix}_CLIENT_SECRET to .env, then restart the app.`,
      });
      return;
    }

    onLoading(true);
    setShowLoggedInfo(true);
    try {
      await signIn(providerName, {
        callbackUrl: `/${locale}/onboarding`,
      });
    } finally {
      onLoading(false);
    }
  };

  return (
    <Button
      onClick={signInHandler}
      {...props}
      variant={"secondary"}
      type="button"
    >
      {children}
    </Button>
  );
};
