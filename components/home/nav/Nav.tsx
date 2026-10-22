"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Menu, X } from "lucide-react";
import { LocaleSwitcher } from "@/components/switchers/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/switchers/ThemeSwitcher";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#features", label: "Features" },
  { href: "#method", label: "Method" },
  { href: "#focus", label: "Focus" },
];

export const Nav = () => {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b transition-colors ${
        scrolled
          ? "border-border bg-background/95 backdrop-blur-sm"
          : "border-transparent bg-background"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2.5"
          aria-label="TaskFlow home"
        >
          <span className="flex h-7 w-7 items-center justify-center border border-foreground/70 font-mono text-[10px] font-medium">
            TF
          </span>
          <span className="font-display text-[1.35rem] leading-none">TaskFlow</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-1.5 md:flex">
          <LocaleSwitcher size="icon" variant="ghost" alignDropdown="end" />
          <ThemeSwitcher size="icon" variant="ghost" alignDropdown="end" />
          <Link
            href={`/${locale}/sign-in`}
            className="ml-2 px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link href={`/${locale}/sign-up`}>
            <Button size="sm" className="h-9 px-4 text-[13px]">
              Start free
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center border border-border md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-5 pb-6 pt-4 md:hidden">
          <div className="flex flex-col">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3 text-sm text-muted-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2">
            <Link href={`/${locale}/sign-in`} className="flex-1">
              <Button variant="outline" className="w-full">
                Sign in
              </Button>
            </Link>
            <Link href={`/${locale}/sign-up`} className="flex-1">
              <Button className="w-full">Start free</Button>
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-1">
            <LocaleSwitcher size="icon" variant="ghost" alignDropdown="start" />
            <ThemeSwitcher size="icon" variant="ghost" alignDropdown="start" />
          </div>
        </div>
      )}
    </nav>
  );
};
