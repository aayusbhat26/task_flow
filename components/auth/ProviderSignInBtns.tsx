"use client";

import { GithubLogo } from "../svg/GithubLogo";
import { GoogleLogo } from "../svg/GoogleLogo";
import { ProviderSignInBtn } from "./ProviderSignInBtn";
import { useTranslations } from "next-intl";
import type { OAuthProviderAvailability } from "@/lib/auth";

const providers = [
  {
    id: "google" as const,
    icon: (props: { width: number; height: number; className?: string }) => (
      <GoogleLogo {...props} />
    ),
  },
  {
    id: "github" as const,
    icon: (props: { width: number; height: number; className?: string }) => (
      <GithubLogo {...props} />
    ),
  },
];

export const ProviderSignInBtns = ({
  signInCard,
  disabled,
  onLoading,
  oauthProviders,
}: {
  signInCard?: boolean;
  disabled?: boolean;
  onLoading: React.Dispatch<React.SetStateAction<boolean>>;
  oauthProviders: OAuthProviderAvailability;
}) => {
  const t = useTranslations("AUTH");

  return (
    <div className="grid grid-cols-1 gap-2">
      {providers.map((provider) => {
        const configured = oauthProviders[provider.id];
        const label = t(
          `${signInCard ? "SIGN_IN" : "SIGN_UP"}.PROVIDERS.${provider.id.toUpperCase()}`
        );

        return (
          <ProviderSignInBtn
            key={provider.id}
            disabled={disabled}
            onLoading={onLoading}
            providerName={provider.id}
            configured={configured}
            className="h-10 w-full justify-start rounded-sm border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-secondary"
          >
            {provider.icon({ width: 16, height: 16, className: "mr-3" })}
            <span className="flex-1 text-left">{label}</span>
            {!configured && (
              <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                Setup needed
              </span>
            )}
          </ProviderSignInBtn>
        );
      })}
    </div>
  );
};
