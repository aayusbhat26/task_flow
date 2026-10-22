import { HomeRecentActivity } from "@/types/extended";
import { ReadOnlyEmoji } from "../common/ReadOnlyEmoji";
import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { UserHoverInfo } from "../common/UserHoverInfoCard";
import { Star, Workflow, PencilRuler, Hash, Users, StickyNote, Timer, Code } from "lucide-react";

interface Props {
  activityItem: HomeRecentActivity;
}

export const HomeRecentActivityItem = ({
  activityItem: {
    emoji,
    link,
    title,
    type,
    updated,
    workspaceId,
    workspaceName,
    starred,
  },
}: Props) => {
  const format = useFormatter();
  const locale = useLocale();
  const dateTime = new Date(updated.at);
  const now = new Date();

  const t = useTranslations("STARRED");
  const c = useTranslations("COMMON");

  const typeLabel = (() => {
    switch (type) {
      case "mindMap":
        return c("EDITED_ITEM_SENTENCE.MIND_MAP");
      case "task":
        return c("EDITED_ITEM_SENTENCE.TASK");
      case "note":
        return c("EDITED_ITEM_SENTENCE.NOTE");
      case "pomodoro":
        return c("EDITED_ITEM_SENTENCE.POMODORO");
      case "dsa":
        return c("EDITED_ITEM_SENTENCE.DSA");
      case "group":
        return "Updated group";
      case "channel":
        return "Updated channel";
      default:
        return c("EDITED_ITEM_SENTENCE.TASK");
    }
  })();

  const typeIcon =
    type === "mindMap" ? (
      <Workflow className="h-3 w-3" />
    ) : type === "task" ? (
      <PencilRuler className="h-3 w-3" />
    ) : type === "channel" ? (
      <Hash className="h-3 w-3" />
    ) : type === "group" ? (
      <Users className="h-3 w-3" />
    ) : type === "note" ? (
      <StickyNote className="h-3 w-3" />
    ) : type === "pomodoro" ? (
      <Timer className="h-3 w-3" />
    ) : (
      <Code className="h-3 w-3" />
    );

  const href = link.startsWith("/") ? `/${locale}${link}` : link;

  return (
    <Link
      href={href}
      className="group flex items-start gap-3 border-b border-border py-4 transition-colors last:border-b-0 hover:bg-secondary/30"
    >
      <div className="relative shrink-0">
        <ReadOnlyEmoji
          className="h-9 w-9 shrink-0"
          selectedEmoji={emoji}
        />
        <span className="absolute -bottom-1 -right-1 border border-border bg-background p-0.5 text-muted-foreground">
          {typeIcon}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[13px] font-medium">
            {!title && type === "mindMap" && t("DEFAULT_NAME.MIND_MAP")}
            {!title && type === "task" && t("DEFAULT_NAME.TASK")}
            {title}
          </h3>
          {starred && <Star className="h-3 w-3 shrink-0 text-primary" />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
          <span>{typeLabel}</span>
          <span aria-hidden>·</span>
          <span>{format.relativeTime(dateTime, now)}</span>
          {updated.by && (
            <>
              <span aria-hidden>·</span>
              <UserHoverInfo className="px-0 text-[9px]" user={updated.by} />
            </>
          )}
          <span aria-hidden>·</span>
          <span>{workspaceName}</span>
        </div>
      </div>
    </Link>
  );
};
