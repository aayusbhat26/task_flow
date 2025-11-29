import Welcoming from "@/components/common/Welcoming";
import { DashboardHeader } from "@/components/header/DashboardHeader";
import { HomeRecentActivityContainer } from "@/components/homeRecentActivity/HomeRecentActivityContainer";
import dynamic from "next/dynamic";

// Lazy load heavy components to improve initial page load
const DSAProgressDashboard = dynamic(
  () => import("@/components/dashboard/DSAProgressDashboard").then(mod => ({ default: mod.DSAProgressDashboard })),
  {
    loading: () => <div className="h-32 bg-muted animate-pulse rounded-lg" />,
    ssr: false
  }
);

const ImportedDSAProgressDashboard = dynamic(
  () => import("@/components/dashboard/ImportedDSAProgressDashboard").then(mod => ({ default: mod.ImportedDSAProgressDashboard })),
  {
    loading: () => <div className="h-32 bg-muted animate-pulse rounded-lg" />,
    ssr: false
  }
);

const GamingStatsWidget = dynamic(
  () => import("@/components/dashboard/GamingStatsWidget"),
  {
    loading: () => <div className="h-32 bg-muted animate-pulse rounded-lg" />,
    ssr: false
  }
);



import { getInitialHomeRecentActivity } from "@/lib/api";
import { checkIfUserCompletedOnboarding } from "@/lib/checkIfUserCompletedOnboarding";
import { db } from "@/lib/db";

const Dashboard = async () => {
  const session = await checkIfUserCompletedOnboarding("/dashboard");

  const initialRecentActivity = await getInitialHomeRecentActivity(session.user.id);

  const userSettings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });
  const showDSA = userSettings?.showDSA ?? true;

  // Check if user has any imported DSA questions
  let importedQuestionsCount = 0;
  try {
    importedQuestionsCount = await db.dSAQuestion.count({
      where: { isImported: true }
    });
    console.log('📊 Imported questions count:', importedQuestionsCount);
  } catch (error) {
    console.error('Error checking imported questions count:', error);
    // Default to 0 if there's an error
    importedQuestionsCount = 0;
  }

  return (
    <>
      <DashboardHeader />
      <main className="min-h-screen bg-background">
        <div className="w-full">
          <Welcoming
            hideOnDesktop
            className="px-3 py-4 sm:px-4 md:px-6 lg:px-8"
            username={session.user.username!}
            name={session.user.name}
            surname={session.user.surname}
          />

          {/* Main Dashboard Content */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8">


            {/* DSA Progress Section - Curated Questions */}
            {showDSA && (
              <section className="space-y-2">
                <DSAProgressDashboard />
              </section>
            )}


            {/* Imported DSA Progress Section - Love Babbar & Others */}
            {showDSA && importedQuestionsCount > 0 && (
              <section className="space-y-2">
                <ImportedDSAProgressDashboard />
              </section>
            )}

            {/* Achievements Section */}
            {showDSA && (
              <section className="space-y-2">
                <GamingStatsWidget />
              </section>
            )}

            {/* Recent Activity Section */}
            <section>
              <HomeRecentActivityContainer
                userId={session.user.id}
                initialData={initialRecentActivity ? initialRecentActivity : []}
              />
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
