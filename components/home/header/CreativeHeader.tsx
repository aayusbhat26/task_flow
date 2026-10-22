import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { getLocale } from "next-intl/server";

const previewTasks = [
  { title: "Draft the launch brief", tag: "Writing", done: true },
  { title: "Review onboarding copy", tag: "Product", done: false },
  { title: "Sketch the workspace map", tag: "Thinking", done: false },
];

export const CreativeHeader = async () => {
  const locale = await getLocale();

  return (
    <header className="relative border-b border-border">
      <div className="mx-auto grid max-w-[1280px] items-center gap-16 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 lg:pb-28 lg:pt-24">
        <div className="max-w-[640px]">
          <div className="mb-8 flex items-center gap-3">
            <span className="h-px w-8 bg-foreground/40" />
            <p className="eyebrow">The working desk, reconsidered</p>
          </div>

          <h1 className="text-[3.4rem] leading-[0.94] sm:text-[4.6rem] lg:text-[5.6rem]">
            The work,
            <br />
            <em className="italic text-primary">without the noise.</em>
          </h1>

          <p className="mt-8 max-w-[500px] text-[15px] leading-[1.8] text-muted-foreground">
            TaskFlow keeps tasks, notes, mind maps and focus sessions on one
            quiet surface. Built for people and small teams who would rather do
            the work than manage the software.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/sign-up`}
              className="inline-flex h-11 items-center gap-2 bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create your workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/sign-in`}
              className="inline-flex h-11 items-center border border-border px-6 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5">
            {[
              "Free to start",
              "Private by default",
              "No credit card",
            ].map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground"
              >
                <Check className="h-3 w-3 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="mb-3 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            A workspace, at a glance
          </p>
          <div className="relative border border-foreground/20 bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Studio — today
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <span className="h-1.5 w-1.5 bg-primary" />
                22 Oct
              </span>
            </div>

            <div className="px-5 py-6">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Thursday
                  </p>
                  <h2 className="mt-1 font-display text-[2rem] leading-none">
                    Today
                  </h2>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">
                  3 open · 1 done
                </p>
              </div>

              <div className="border-t border-border">
                {previewTasks.map((task, index) => (
                  <div
                    key={task.title}
                    className="flex items-center gap-3 border-b border-border py-3.5"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                        task.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-foreground/25"
                      }`}
                    >
                      {task.done && <Check className="h-3 w-3" />}
                    </span>
                    <span
                      className={`flex-1 text-[13px] ${
                        task.done
                          ? "text-muted-foreground line-through decoration-border"
                          : ""
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-4 border border-border bg-background/60 p-4">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    Focus · round one
                  </p>
                  <p className="mt-1 font-mono text-2xl tracking-tight">
                    25:00
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center border border-foreground/25">
                  <span className="ml-0.5 h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-foreground" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border px-5 py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Tasks / Notes / Maps
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Preview
              </span>
            </div>
          </div>

          <div className="absolute -bottom-4 -left-4 -z-10 h-full w-full border border-border" />
        </div>
      </div>
    </header>
  );
};
