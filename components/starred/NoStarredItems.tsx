"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

export const NoStarredItems = () => {
  const t = useTranslations("STARRED.NO_ITEMS");
  const locale = useLocale();

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 sm:px-8">
      <div className="border-b border-border pb-6">
        <p className="eyebrow">Starred</p>
        <h1 className="mt-2 font-display text-4xl leading-none">
          {t("TITLE")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("DESC")}</p>
      </div>
      <div className="mt-6 flex items-start gap-4 border border-border bg-card p-6">
        <Star className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Star a task or mind map from its menu and it will appear here for
            quick access.
          </p>
          <Link
            href={`/${locale}/dashboard`}
            className="mt-3 inline-flex text-[13px] underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            Back to the dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
