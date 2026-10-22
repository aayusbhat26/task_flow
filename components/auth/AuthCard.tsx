"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { SignUpCardContent } from "./SignUpCardContent";
import { SignInCardContent } from "./SignInCardContent";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import type { OAuthProviderAvailability } from "@/lib/auth";

interface Props {
  signInCard?: boolean;
  oauthProviders: OAuthProviderAvailability;
}

export const AuthCard = ({ signInCard, oauthProviders }: Props) => {
  const t = useTranslations("AUTH");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="w-full">
      <Link
        href={`/${locale}`}
        className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to overview
      </Link>

      <div className="mb-8">
        <p className="eyebrow mb-3">
          {signInCard ? "Member access" : "New workspace"}
        </p>
        <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
          {signInCard ? t("SIGN_IN.TITLE") : t("SIGN_UP.TITLE")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {signInCard ? t("SIGN_IN.DESC") : t("SIGN_UP.DESC")}
        </p>
      </div>

      {signInCard ? (
        <SignInCardContent oauthProviders={oauthProviders} />
      ) : (
        <SignUpCardContent oauthProviders={oauthProviders} />
      )}

      <div className="mt-8 border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          {signInCard
            ? t("SIGN_IN.DONT_HAVE_ACCOUNT.FIRST")
            : t("SIGN_UP.HAVE_ACCOUNT.FIRST")}{" "}
          <Link
            href={`/${locale}/${signInCard ? "sign-up" : "sign-in"}`}
            className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
          >
            {signInCard
              ? t("SIGN_IN.DONT_HAVE_ACCOUNT.SECOND")
              : t("SIGN_UP.HAVE_ACCOUNT.SECOND")}
          </Link>
        </p>
      </div>
    </div>
  );
};
