import Welcoming from "@/components/common/Welcoming";
import { DashboardHeader } from "@/components/header/DashboardHeader";
import { HomeRecentActivityContainer } from "@/components/homeRecentActivity/HomeRecentActivityContainer";
import dynamic from "next/dynamic";
import { getInitialHomeRecentActivity } from "@/lib/api";
import { checkIfUserCompletedOnboarding } from "@/lib/checkIfUserCompletedOnboarding";
import { db } from "@/lib/db";

const DSAProgressDashboard = dynamic(
  () =>
    import("@/components/dashboard/DSAProgressDashboard").then((mod) => ({
      default: mod.DSAProgressDashboard,
    })),
  {
    loading: () => <div className="h-44 animate-pulse border border-border bg-card" />,
  }
);

const ImportedDSAProgressDashboard = dynamic(
  () =>
    import("@/components/dashboard/ImportedDSAProgressDashboard").then((mod) => ({
      default: mod.ImportedDSAProgressDashboard,
    })),
  {
    loading: () => <div className="h-44 animate-pulse border border-border bg-card" />,
  }
);

const GamingStatsWidget = dynamic(
  () => import("@/components/dashboard/GamingStatsWidget"),
  {
    loading: () => <div className="h-56 animate-pulse border border-border bg-card" />,
  }
);

const UnreadMentionsWidget = dynamic(
  () =>
    import("@/components/dashboard/UnreadMentionsWidget").then((mod) => ({
      default: mod.UnreadMentionsWidget,
    })),
  {
    loading: () => <div className="h-56 animate-pulse border border-border bg-card" />,
  }
);

const DailyGoalTracker = dynamic(
  () =>
    import("@/components/dashboard/DailyGoalTracker").then((mod) => ({
      default: mod.DailyGoalTracker,
    })),
  {
    loading: () => <div className="h-56 animate-pulse border border-border bg-card" />,
  }
);

const Dashboard = async () => {
  const session = await checkIfUserCompletedOnboarding("/dashboard");

  const [initialRecentActivity, userSettings, importedQuestionsCount] =
    await Promise.all([
      getInitialHomeRecentActivity(session.user.id),
      db.userSettings.findUnique({
        where: { userId: session.user.id },
      }),
      db.dSAQuestion
        .count({ where: { isImported: true } })
        .catch(() => 0),
    ]);

  const showDSA = userSettings?.showDSA ?? true;

  return (
    <>
      <DashboardHeader />
      <main className="min-h-full">
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-16 sm:px-8">
          <Welcoming
            className="py-10 sm:py-12"
            username={session.user.username!}
            name={session.user.name}
            surname={session.user.surname}
          />

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <DailyGoalTracker />
            </div>
            <div className="lg:col-span-7">
              <UnreadMentionsWidget />
            </div>

            {showDSA && (
              <div className="lg:col-span-12">
                <DSAProgressDashboard />
              </div>
            )}

            {showDSA && importedQuestionsCount > 0 && (
              <div className="lg:col-span-12">
                <ImportedDSAProgressDashboard />
              </div>
            )}

            <div className="lg:col-span-8">
              <section className="h-full border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-6 py-5">
                  <div>
                    <p className="eyebrow">The record</p>
                    <h2 className="mt-2 font-display text-2xl leading-none">
                      Recent activity
                    </h2>
                  </div>
                  <p className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground sm:block">
                    Latest edits
                  </p>
                </div>
                <div className="px-6 py-2">
                  <HomeRecentActivityContainer
                    userId={session.user.id}
                    initialData={initialRecentActivity ? initialRecentActivity : []}
                  />
                </div>
              </section>
            </div>

            {showDSA && (
              <div className="lg:col-span-4">
                <GamingStatsWidget />
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
