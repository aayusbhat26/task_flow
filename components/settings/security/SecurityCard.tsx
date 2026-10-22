import Warning from "@/components/ui/warning";
import { useTranslations } from "next-intl";
import { ChangePassword } from "./ChangePassword";

export const SecurityCard = ({ hasPassword }: { hasPassword: boolean }) => {
  const t = useTranslations("SETTINGS.SECURITY");

  return (
    <div>
      <div className="border-b border-border pb-6">
        <p className="eyebrow">Settings</p>
        <h1 className="mt-2 font-display text-4xl leading-none">
          {t("TITLE")}
        </h1>
        <p className="mt-3 max-w-[560px] text-sm leading-relaxed text-muted-foreground">
          {t(hasPassword ? "DESC" : "DESC_SET")}
        </p>
      </div>
      {!hasPassword && (
        <Warning blue className="mt-6">
          <p>{t("WARNING.OAUTH")}</p>
        </Warning>
      )}
      <div className="mt-8">
        <ChangePassword hasPassword={hasPassword} />
      </div>
    </div>
  );
};
