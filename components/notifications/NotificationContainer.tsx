"use client";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { NotificationItem } from "./NotificationItem";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { UserNotification } from "@/types/extended";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { LoadingState } from "../ui/loadingState";
import { ClientError } from "../error/ClientError";

interface Props {
  userId: string;
}

export const NotificationContainer = ({ userId }: Props) => {
  const queryClient = useQueryClient();
  const m = useTranslations("MESSAGES");
  const t = useTranslations("NOTIFICATIONS");

  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [unseenNotifications, setUnseenNotifications] = useState<
    UserNotification[]
  >([]);
  const [isAnyClickedFalse, setIsAnyClickedFalse] = useState(false);
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  // Check if we have cached notifications data
  const cachedData = queryClient.getQueryData<UserNotification[]>(["getUserNotifications"]);
  const shouldFetchInitially = !cachedData;

  const {
    data: userNotifications,
    isError,
    isLoading,
    refetch,
  } = useQuery<UserNotification[], Error>({
    queryFn: async () => {
      const res = await fetch(`/api/notifications/get?userId=${userId}`);

      if (!res.ok) {
        const error = (await res.json()) as string;
        throw new Error(error);
      }

      const response = await res.json();

      return response;
    },
    // Remove automatic polling - only fetch initially if no cached data
    enabled: shouldFetchInitially || isManualRefresh,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    queryKey: ["getUserNotifications"],
  });
  const { mutate: updateAllToClickStatus } = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/notifications/set-click/all`);
    },
    onMutate: async () => {
      //@ts-ignore
      await queryClient.cancelQueries(["getUserNotifications"]);
      const previousNotifications = userNotifications;

      const checkedPreviousNotifications =
        previousNotifications && previousNotifications.length > 0
          ? previousNotifications
          : [];

      const updatedNotifications = checkedPreviousNotifications.map(
        (notify) => {
          return {
            ...notify,
            clicked: true,
          };
        }
      );

      queryClient.setQueryData(["getUserNotifications"], updatedNotifications);

      return { checkedPreviousNotifications };
    },
    onError: (err: AxiosError, _, context) => {
      queryClient.setQueryData(
        ["getUserNotifications"],
        context?.checkedPreviousNotifications
      );

      toast({
        title: m("ERRORS.CANT_UPDATE_SEEN_NOTIFY"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["getUserNotifications"] });
    },
    mutationKey: ["updateAllToClickStatus"],
  });

  const { mutate: updateToSeenNotifications } = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/notifications/set-seen`);
    },
    onMutate: async () => {
      //@ts-ignore
      await queryClient.cancelQueries(["getUserNotifications"]);
      const previousNotifications = userNotifications;

      const checkedPreviousNotifications =
        previousNotifications && previousNotifications.length > 0
          ? previousNotifications
          : [];

      const updatedNotifications = checkedPreviousNotifications.map(
        (notify) => {
          return {
            ...notify,
            seen: true,
          };
        }
      );

      queryClient.setQueryData(["getUserNotifications"], updatedNotifications);

      return { checkedPreviousNotifications };
    },
    onError: (err: AxiosError, _, context) => {
      queryClient.setQueryData(
        ["getUserNotifications"],
        context?.checkedPreviousNotifications
      );

      toast({
        title: m("ERRORS.CANT_UPDATE_SEEN_NOTIFY"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["getUserNotifications"] });
    },
    mutationKey: ["updateToSeenNotifications"],
  });

  useEffect(() => {
    if (!userNotifications) return;

    const unseen = userNotifications.filter(
      (notification) => !notification.seen
    );
    const isAnyClicked = userNotifications.some((notify) => !notify.clicked);

    setIsAnyClickedFalse(isAnyClicked);
    setUnseenNotifications(unseen);
  }, [userNotifications]);

  useEffect(() => {
    if (unseenNotifications.length === 0 || !open) return;

    updateToSeenNotifications();
  }, [open, unseenNotifications, updateToSeenNotifications]);

  // Smart notification refreshing: only when popup opens or manual refresh
  useEffect(() => {
    if (open && userNotifications) {
      // When popup opens, refresh notifications if data is older than 2 minutes
      const lastFetch = queryClient.getQueryState(["getUserNotifications"])?.dataUpdatedAt;
      const now = Date.now();
      const twoMinutes = 2 * 60 * 1000;
      
      if (!lastFetch || (now - lastFetch) > twoMinutes) {
        setIsManualRefresh(true);
        refetch().finally(() => setIsManualRefresh(false));
      }
    }
  }, [open, queryClient, refetch, userNotifications]);

  // Manual refresh function for user-triggered refresh
  const handleManualRefresh = () => {
    setIsManualRefresh(true);
    refetch().finally(() => setIsManualRefresh(false));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="relative h-8 w-8"
          variant={"ghost"}
          size={"icon"}
          title={t("TITLE")}
          aria-label={t("TITLE")}
        >
          <Bell size={16} />
          {unseenNotifications.length !== 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center bg-primary px-0.5 font-mono text-[8px] text-primary-foreground">
              {unseenNotifications.length > 9 ? "+9" : unseenNotifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          className="w-fit max-w-[300px] sm:max-w-[390px] p-2 sm:p-4"
        >
          {isError ? (
            <ClientError
              onRefetch={handleManualRefresh}
              className="bg-popover mt-0 sm:mt-0 md:mt-0"
              message={t("ERROR")}
            />
          ) : isLoading ? (
            <div className="w-28 h-28 flex justify-center items-center">
              <LoadingState className="w-6 h-6" />
            </div>
          ) : userNotifications && userNotifications?.length > 0 ? (
            <div className="flex flex-col gap-6">
              <div className="flex gap-2 sm:gap-6 items-center justify-between">
                <h4 className="font-medium leading-none">{t("TITLE")}</h4>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleManualRefresh}
                    disabled={isLoading || isManualRefresh}
                    className="text-xs"
                    size={"sm"}
                    variant={"outline"}
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${(isLoading || isManualRefresh) ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    disabled={!isAnyClickedFalse}
                    onClick={() => {
                      updateAllToClickStatus();
                    }}
                    className="text-xs"
                    size={"sm"}
                    variant={"secondary"}
                  >
                    {t("MARK_AS_READ")}
                  </Button>
                </div>
              </div>
              <ScrollArea
                className={`${
                  userNotifications.length >= 4
                    ? userNotifications.length >= 8
                      ? "h-96"
                      : "h-72"
                    : "h-56"
                }`}
              >
                <div className="flex flex-col gap-3 h-full">
                  {userNotifications?.map((notify) => (
                    <NotificationItem key={notify.id} notify={notify} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="py-2">
              <p className="font-semibold">{t("NO_NOTIFICATIONS")}</p>
            </div>
          )}
        </PopoverContent>
    </Popover>
  );
};
