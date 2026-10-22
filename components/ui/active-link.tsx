"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

interface Props {
  href: string;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | null;
  size?: "default" | "sm" | "lg" | "icon" | null;
  children?: React.ReactNode;
  include?: string;
  workspaceIcon?: boolean;
  disableActiveStateColor?: boolean;
  // New prop to handle special cases where Link can't be used
  forceDiv?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  "aria-label"?: string;
}

const ActiveLink = React.forwardRef<HTMLAnchorElement, Props>(
  (
    {
      href,
      className,
      variant = "default",
      size = "default",
      children,
      include,
      workspaceIcon,
      disableActiveStateColor = false,
      forceDiv = false,
      onClick,
      ...props
    }: Props,
    ref
  ) => {
    const pathname = usePathname();
    const router = useRouter();

    // Determine if this link is active
    const isActive = href === pathname || (include && pathname.includes(include));

    // Calculate the link class
    const linkClass = cn(
      buttonVariants({ variant, size }),
      {
        "border border-foreground/40 bg-secondary": isActive && workspaceIcon,
        "relative bg-secondary font-medium text-foreground after:absolute after:bottom-2 after:left-0 after:top-2 after:w-[2px] after:bg-primary":
          isActive && !workspaceIcon && !disableActiveStateColor,
      },
      className
    );

    // Handle navigation for div elements
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      router.push(href);
    };

    // Only render as div if explicitly forced (for special cases like HoverCardTrigger)
    if (forceDiv) {
      return (
        <div 
          className={cn(linkClass, "cursor-pointer")}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              router.push(href);
            }
          }}
          aria-label={`Navigate to ${href}`}
          ref={ref as any}
          {...(props as any)}
        >
          {children}
        </div>
      );
    }

    // Default: Always use Next.js Link for optimal performance
    return (
      <Link
        href={href}
        className={linkClass}
        prefetch={true} // Explicitly enable prefetching
        ref={ref}
        onClick={onClick}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

ActiveLink.displayName = "ActiveLink";

export default ActiveLink;