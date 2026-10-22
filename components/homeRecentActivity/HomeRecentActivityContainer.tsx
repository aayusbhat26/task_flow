"use client";

import { useGetAssignedToMeParams } from "@/hooks/useGetAssignedToMeParams";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card";

import { AssignedToMeDataItem, HomeRecentActivity } from "@/types/extended";
import { LoadingScreen } from "../common/LoadingScreen";
import { ClientError } from "../error/ClientError";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useIntersection } from "@mantine/hooks";
import { LoadingState } from "../ui/loadingState";
import { HomeRecentActivityItem } from "./HomeRecentActivityItem";
import { ACTIVITY_PER_PAGE } from "@/lib/constants";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
  userId: string;
  initialData: HomeRecentActivity[];
}

export const HomeRecentActivityContainer = ({ userId, initialData }: Props) => {
  const { currentType, workspaceFilterParam } = useGetAssignedToMeParams();
  const m = useTranslations("MESSAGES");
  const t = useTranslations("HOME_PAGE");

  const [isAllFetched, setIsAllFetched] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const lastActivityItem = useRef<null | HTMLDivElement>(null);

  const { entry, ref } = useIntersection({
    root: lastActivityItem.current,
    threshold: 1,
  });

  const { data, isFetchingNextPage, fetchNextPage, isError } = useInfiniteQuery(
    {
      initialPageParam: 1,
      queryKey: ["getHomeRecentActivity"],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await fetch(
          `/api/home-page/get?userId=${userId}&page=${pageParam}&take=${ACTIVITY_PER_PAGE}`
        );
        const posts = (await res.json()) as HomeRecentActivity[];
        return posts;
      },
      getNextPageParam: (_, pages) => {
        return pages.length + 1;
      },
      gcTime: 0,
    }
  );

  useEffect(() => {
    if (data?.pages[data.pages.length - 1].length === 0) setIsAllFetched(true);
  }, [data?.pages, initialData]);

  useEffect(() => {
    if (!isAllFetched && entry?.isIntersecting) {
      fetchNextPage();
    }
  }, [entry, isAllFetched, fetchNextPage]);

  const activityItems = useMemo(() => {
    const all = data?.pages.flatMap((page) => page) ?? initialData;
    return showAll ? all : all.slice(0, 3);
  }, [data?.pages, initialData, showAll]);

  if (isError) {
    return <ClientError message={t("ERROR")} />;
  }

  if (activityItems.length === 0) {
    return (
      <div className="flex items-start gap-4 py-8">
        <Activity size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
        <p className="max-w-[420px] text-[13px] leading-relaxed text-muted-foreground">
          {t("NO_DATA")}
        </p>
      </div>
    );
  }

  return (
    <div className="">
      {activityItems.map((activityItem, i) => {
        if (i === activityItems.length - 1) {
          return (
            <div key={activityItem.id} ref={ref}>
              <HomeRecentActivityItem activityItem={activityItem} />
            </div>
          );
        } else {
          return (
            <HomeRecentActivityItem
              key={activityItem.id}
              activityItem={activityItem}
            />
          );
        }
      })}
      {isFetchingNextPage && showAll && (
        <div className="flex justify-center items-center mt-2">
          <LoadingState />
        </div>
      )}
      {(data?.pages.flatMap((page) => page) ?? initialData).length > 3 && (
        <Button 
          variant="ghost" 
          className="mt-2 w-full border-t border-border text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>View Less <ChevronUp className="ml-2 w-4 h-4" /></>
          ) : (
            <>View More <ChevronDown className="ml-2 w-4 h-4" /></>
          )}
        </Button>
      )}
    </div>
  );
};
