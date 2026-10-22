import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center border border-foreground/70 font-mono text-[10px] font-medium">
                TF
              </span>
              <span className="font-display text-[1.35rem] leading-none">
                TaskFlow
              </span>
            </div>
            <p className="mt-4 max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
              A quiet workspace for tasks, notes, maps and focus. Built to be
              useful, not loud.
            </p>
          </div>

          <div>
            <p className="eyebrow mb-4">Product</p>
            <div className="flex flex-col gap-2.5 text-[13px] text-muted-foreground">
              <a href="#features" className="transition-colors hover:text-foreground">
                Features
              </a>
              <a href="#method" className="transition-colors hover:text-foreground">
                Method
              </a>
              <a href="#focus" className="transition-colors hover:text-foreground">
                Focus timer
              </a>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-4">Account</p>
            <div className="flex flex-col gap-2.5 text-[13px] text-muted-foreground">
              <Link href="/sign-in" className="transition-colors hover:text-foreground">
                Sign in
              </Link>
              <Link href="/sign-up" className="transition-colors hover:text-foreground">
                Create a workspace
              </Link>
              <a
                href="https://github.com/aayusbhat26/task_flow"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                Source
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-border pt-5 sm:flex-row sm:items-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            © 2026 TaskFlow
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            Made for the work between the work
          </p>
        </div>
      </div>
    </footer>
  );
};
