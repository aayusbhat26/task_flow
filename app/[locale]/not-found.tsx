import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        404 — page not found
      </p>
      <h1 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">
        Nothing on this page.
      </h1>
      <p className="mt-4 max-w-[360px] text-sm leading-relaxed text-muted-foreground">
        The link may be out of date, or the workspace may have moved. The
        dashboard is a good place to start again.
      </p>
      <div className="mt-8 flex items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center border border-border px-5 text-sm transition-colors hover:bg-secondary"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
