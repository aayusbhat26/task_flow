"use client";

import { UserAvatar } from "@/components/ui/user-avatar";
import { useTruncateText } from "@/hooks/useTruncateText";

interface Props {
  image: string | null;
  username: string;
  maxText?: number;
  active?: boolean;
}

export const UserStatus = ({ image, username, maxText, active }: Props) => {
  const name = useTruncateText(username, maxText!);
  return (
    <div
      className={`flex items-center gap-2 rounded-sm bg-background px-1.5 py-1 transition-colors hover:bg-secondary ${
        !active ? "opacity-50" : ""
      }`}
    >
      <div className="relative">
        <UserAvatar
          className="h-7 w-7"
          profileImage={image}
          fallbackText={username ? username[0].toUpperCase() : "?"}
          userId={username}
          size={14}
        />
        {active && (
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-border shadow-sm border-2 bg-primary"></div>
        )}
      </div>
      <p className="truncate text-[12px] text-muted-foreground">{username}</p>
    </div>
  );
};
