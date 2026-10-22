import Link from "next/link";
import { getLocale } from "next-intl/server";
import {
  ArrowUpRight,
  CalendarDays,
  ListTodo,
  Network,
  NotebookPen,
  Timer,
  Users,
} from "lucide-react";

const features = [
  {
    n: "01",
    icon: ListTodo,
    title: "Tasks with room to think",
    body: "Write in a proper editor, attach dates and owners, and see what changed without digging. Autosave means there is nothing to lose.",
    note: "Editor · dates · tags · assignments",
  },
  {
    n: "02",
    icon: Network,
    title: "Mind maps that stay useful",
    body: "Move from scattered notes to a structure you can see. Map the problem, then turn the branches into real tasks.",
    note: "Canvas · shapes · export",
  },
  {
    n: "03",
    icon: NotebookPen,
    title: "Notes beside the work",
    body: "A markdown workspace for the thinking that does not fit in a task. Keep it, link it, come back to it.",
    note: "Markdown · preview · autosave",
  },
  {
    n: "04",
    icon: Timer,
    title: "Focus that stays visible",
    body: "A Pomodoro timer with rounds, breaks and a small reward. It runs in the workspace instead of another tab.",
    note: "Rounds · breaks · history",
  },
  {
    n: "05",
    icon: CalendarDays,
    title: "One honest calendar",
    body: "Deadlines and focus blocks in the same month view. No sync gymnastics, no duplicate events.",
    note: "Month view · tasks · time blocks",
  },
  {
    n: "06",
    icon: Users,
    title: "Shared, with clear roles",
    body: "Invite the people who need to be there. Owners, admins, editors and viewers get exactly the access they need.",
    note: "Workspaces · roles · invites",
  },
];

const method = [
  {
    n: "01",
    title: "Begin with today",
    body: "The home view is not a report. It is the handful of things that deserve attention now, followed by a record of what moved.",
  },
  {
    n: "02",
    title: "Think in structure",
    body: "When a task is not enough, open a note. When a note is not enough, open a map. The thought keeps its shape as it grows.",
  },
  {
    n: "03",
    title: "Protect the hour",
    body: "Start a round, close the other tabs, and let the timer hold the boundary. Progress is recorded quietly in the background.",
  },
];

export const LandingSections = async () => {
  const locale = await getLocale();

  return (
    <>
      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="eyebrow">What is inside</p>
              <h2 className="mt-4 max-w-[420px] font-display text-[2.7rem] leading-[1.02] sm:text-[3.4rem]">
                Six surfaces. One thread.
              </h2>
              <p className="mt-5 max-w-[380px] text-sm leading-[1.8] text-muted-foreground">
                Each tool is useful on its own. Together they keep a project&apos;s
                context from scattering across five different apps.
              </p>
            </div>

            <div className="grid border-l border-t border-border sm:grid-cols-2">
              {features.map((feature) => (
                <article
                  key={feature.n}
                  className="group flex flex-col border-b border-r border-border p-6 transition-colors hover:bg-secondary/40 sm:p-7"
                >
                  <div className="flex items-start justify-between">
                    <feature.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {feature.n}
                    </span>
                  </div>
                  <h3 className="mt-8 font-display text-[1.55rem] leading-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[13px] leading-[1.75] text-muted-foreground">
                    {feature.body}
                  </p>
                  <p className="mt-6 border-t border-border pt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                    {feature.note}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="method" className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="eyebrow">The method</p>
              <h2 className="mt-4 max-w-[360px] font-display text-[2.7rem] leading-[1.02] sm:text-[3.4rem]">
                Less software.
                <br />
                More finished work.
              </h2>
              <p className="mt-5 max-w-[360px] text-sm leading-[1.8] text-muted-foreground">
                TaskFlow is opinionated about attention. The interface stays
                still, the record stays honest, and nothing asks for more of
                your day than it gives back.
              </p>
              <div className="mt-8 border-l-2 border-primary pl-4">
                <p className="font-display text-lg italic leading-snug text-foreground/80">
                  &ldquo;Make the next action obvious, then get out of the
                  way.&rdquo;
                </p>
              </div>
            </div>

            <div className="divide-y divide-border border-y border-border">
              {method.map((step) => (
                <div
                  key={step.n}
                  className="grid gap-3 py-7 sm:grid-cols-[64px_1fr] sm:gap-6"
                >
                  <span className="font-mono text-[11px] text-primary">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-medium">{step.title}</h3>
                    <p className="mt-2 max-w-[520px] text-[13px] leading-[1.75] text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="focus" className="border-b border-border">
        <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:py-24">
          <div className="grid items-center gap-10 border border-border bg-card p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:p-16">
            <div>
              <p className="eyebrow">A room for one hour</p>
              <h2 className="mt-4 max-w-[540px] font-display text-[2.7rem] leading-[1.02] sm:text-[3.4rem]">
                The most useful feature is the one that asks you to stop
                switching.
              </h2>
              <div className="mt-8 flex flex-wrap gap-6 border-t border-border pt-5">
                {[
                  ["25", "minute rounds"],
                  ["5", "minute breaks"],
                  ["1", "thing at a time"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <p className="font-mono text-2xl">{value}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex h-[280px] w-full items-center justify-center border border-border bg-background lg:w-[360px]">
              <div className="text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Time to focus
                </p>
                <p className="mt-3 font-display text-[5.5rem] leading-none tracking-tight">
                  25:00
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Round 1 of 3
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-end lg:py-20">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/50">
              Ready when you are
            </p>
            <h2 className="mt-4 max-w-[620px] font-display text-[2.9rem] leading-[1.02] sm:text-[4rem]">
              Make room for the work.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/sign-up`}
              className="inline-flex h-11 items-center gap-2 bg-background px-6 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
            >
              Start a workspace
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/sign-in`}
              className="inline-flex h-11 items-center border border-background/30 px-6 text-sm text-background transition-colors hover:bg-background/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
