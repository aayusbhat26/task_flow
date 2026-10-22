import { LocaleSwitcher } from "@/components/switchers/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/switchers/ThemeSwitcher";
import Link from "next/link";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-dvh bg-background" suppressHydrationWarning>
      <div className="grid min-h-dvh lg:grid-cols-[1.02fr_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-12 text-background lg:flex">
          <div className="absolute inset-0 hairline-grid opacity-[0.06]" />
          <div className="relative">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-background"
            >
              <span className="flex h-8 w-8 items-center justify-center border border-background/30 font-mono text-xs">
                TF
              </span>
              <span className="font-display text-2xl leading-none">TaskFlow</span>
            </Link>
          </div>

          <div className="relative max-w-md">
            <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.2em] text-background/50">
              The working desk, reconsidered
            </p>
            <blockquote className="font-display text-4xl leading-[1.1] text-background">
              “A calm surface for the work that actually matters.”
            </blockquote>
            <div className="mt-10 border-t border-background/20 pt-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-background/45">
                    Plan
                  </p>
                  <p className="mt-1.5 text-background/85">Tasks & calendar</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-background/45">
                    Think
                  </p>
                  <p className="mt-1.5 text-background/85">Notes & mind maps</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-background/45">
                    Focus
                  </p>
                  <p className="mt-1.5 text-background/85">A timer that stays</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-background/45">
                    Together
                  </p>
                  <p className="mt-1.5 text-background/85">Shared workspaces</p>
                </div>
              </div>
            </div>
          </div>

          <p className="relative font-mono text-[10px] uppercase tracking-[0.16em] text-background/40">
            TaskFlow · 2026
          </p>
        </aside>

        <section className="flex min-h-dvh flex-col">
          <header className="flex items-center justify-between border-b border-border px-5 py-4 lg:justify-end lg:border-none lg:px-8">
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-7 w-7 items-center justify-center border border-border font-mono text-[10px]">
                TF
              </span>
              <span className="font-display text-xl leading-none">TaskFlow</span>
            </Link>
            <div className="flex items-center gap-1">
              <LocaleSwitcher
                alignHover="end"
                alignDropdown="end"
                size="icon"
                variant="ghost"
              />
              <ThemeSwitcher
                alignHover="end"
                alignDropdown="end"
                size="icon"
                variant="ghost"
              />
            </div>
          </header>

          <div className="flex flex-1 items-start justify-center px-5 py-10 sm:px-10 lg:items-center lg:py-16">
            <div className="w-full max-w-sm">{children}</div>
          </div>

          <footer className="border-t border-border px-5 py-4 lg:px-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              TaskFlow · a considered workspace
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
};

export default AuthLayout;
