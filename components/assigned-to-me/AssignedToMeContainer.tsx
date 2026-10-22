"use client";

import { useGetAssignedToMeParams } from "@/hooks/useGetAssignedToMeParams";
import { useQuery } from "@tanstack/react-query";

import { AssignedToMeItem } from "./AssignedToMeItem";
import { AssignedToMeDataItem } from "@/types/extended";
import { LoadingScreen } from "../common/LoadingScreen";
import { ClientError } from "../error/ClientError";
import { useTranslations } from "next-intl";

interface Props {
  userId: string;
}

export const AssignedToMeContainer = ({ userId }: Props) => {
  const { currentType, workspaceFilterParam } = useGetAssignedToMeParams();
  const m = useTranslations("MESSAGES");
  const t = useTranslations("ASSIGNED_TO_ME");

  const {
    data: assignedInfo,
    isLoading,
    isError,
    error,
  } = useQuery<AssignedToMeDataItem[], Error>({
    queryFn: async () => {
      const res = await fetch(
        `/api/assigned_to/get?workspace=${workspaceFilterParam}&type=${currentType}&userId=${userId}`
      );

      if (!res.ok) {
        const error = (await res.json()) as string;
        throw new Error(error);
      }

      const data = await res.json();
      return data;
    },
    queryKey: [
      "getAssignedToMeInfo",
      userId,
      workspaceFilterParam,
      currentType,
    ],
  });

  if (isLoading) return <LoadingScreen />;

  if (isError) {
    return (
      <ClientError
        message={m(error.message)}
        hrefToGoOnReset="/dashboard/assigned-to-me?workspace=all&type=all"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="border-b border-border pb-5 sm:flex sm:items-end sm:justify-between">
        <div className="flex flex-col space-y-1.5 mb-4 sm:mb-0">
          <h1 className="font-display text-3xl leading-none sm:text-4xl">
            {t("TITLE")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("DESC")}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-col">
        {currentType === "all" &&
        workspaceFilterParam === "all" &&
        assignedInfo?.length === 0 ? (
          <p className="mt-6 border border-border bg-card px-6 py-8 text-sm leading-relaxed text-muted-foreground">{t("NO_ASSIGNMENT")}</p>
        ) : assignedInfo?.length === 0 ? (
          <p className="mt-6 border border-border bg-card px-6 py-8 text-sm leading-relaxed text-muted-foreground">{t("NOT_FOUND")}</p>
        ) : (
          assignedInfo?.map((info) => (
            <AssignedToMeItem info={info} key={info.id} />
          ))
        )}
      </div>
    </div>
  );
};
