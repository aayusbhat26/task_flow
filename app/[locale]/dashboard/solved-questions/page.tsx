import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { checkIfUserCompletedOnboarding } from "@/lib/checkIfUserCompletedOnboarding";

export default async function SolvedQuestionsPage() {
  await checkIfUserCompletedOnboarding("/dashboard/solved-questions");
  const locale = await getLocale();

  redirect(`/${locale}/dsa`);
}
