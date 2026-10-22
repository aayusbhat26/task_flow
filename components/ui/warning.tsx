"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  hideIcon?: boolean;
  yellow?: boolean;
  blue?: boolean;
}

const Warning = React.forwardRef<HTMLDivElement, Props>(
  ({ className, children, hideIcon, yellow, blue, ...props }: Props, ref) => {
    const t = useTranslations("COMMON");

    return (
      <div
        ref={ref}
        className={cn(
          "my-4 flex flex-col gap-2 border border-border border-l-2 bg-secondary/40 px-4 py-3 text-foreground",
          yellow
            ? "border-l-chart-3"
            : blue
              ? "border-l-primary"
              : "border-l-destructive",
          className
        )}
        {...props}
      >
        {!hideIcon && (
          <div className="flex items-center gap-2">
            {blue ? (
              <Info className="h-3.5 w-3.5 text-primary" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            )}
            <p className="eyebrow">
              {blue ? t("NOTICE") : t("WARNING")}
            </p>
          </div>
        )}
        <div className="text-[13px] leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
    );
  }
);

Warning.displayName = "Warning";

export default Warning;
