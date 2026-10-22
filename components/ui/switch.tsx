"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  className?: string;
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, onCheckedChange, checked, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className="flex items-center space-x-2">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            onChange={handleChange}
            checked={checked}
            {...props}
          />
          <div
            className={cn(
              "relative h-5 w-9 rounded-sm border border-border bg-muted transition-colors duration-150",
              "peer-checked:border-primary peer-checked:bg-primary",
              "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              className
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 h-3.5 w-3.5 rounded-sm bg-background transition-all duration-150",
                checked ? "left-[18px]" : "left-0.5"
              )}
            />
          </div>
        </label>
        {label && (
          <span className="text-sm font-medium text-foreground">{label}</span>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
