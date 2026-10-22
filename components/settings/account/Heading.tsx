import { useTranslations } from "next-intl";

export const Heading = () => {
  const t = useTranslations("SETTINGS");

  return (
    <div className="border-b border-border pb-6">
      <p className="eyebrow">Settings</p>
      <h1 className="mt-2 font-display text-4xl leading-none">
        {t("ACCOUNT.TITLE")}
      </h1>
      <p className="mt-3 max-w-[520px] text-sm leading-relaxed text-muted-foreground">
        {t("ACCOUNT.DESC")}
      </p>
    </div>
  );
};
