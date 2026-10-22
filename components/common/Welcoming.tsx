"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useFormatter } from "next-intl";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
  showOnlyOnPath?: string;
  username: string;
  name?: string | null;
  surname?: string | null;
}

const Welcoming = React.forwardRef<HTMLDivElement, Props>(
  (
    {
      className,
      hideOnMobile,
      hideOnDesktop,
      showOnlyOnPath,
      username,
      surname,
      name,
      ...props
    },
    ref
  ) => {
    const pathname = usePathname();
    const format = useFormatter();
    const dateTime = new Date();

    const day = format.dateTime(dateTime, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (showOnlyOnPath && pathname !== showOnlyOnPath) return null;

    const displayName = name
      ? name && surname
        ? `${name} ${surname}`
        : name
      : username;

    return (
      <div
        ref={ref}
        className={cn(
          `space-y-3 ${hideOnDesktop ? "lg:hidden" : ""} ${
            hideOnMobile ? "hidden lg:block" : ""
          }`,
          className
        )}
        {...props}
      >
        <p className="eyebrow">{day}</p>
        <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
          Welcome back, {displayName}.
        </h1>
      </div>
    );
  }
);

Welcoming.displayName = "Welcoming";

export default Welcoming;
