import { cn, getRandomColor } from "@/lib/utils";
import { User } from "lucide-react";
import Image from "next/image";

interface Props {
  size?: number;
  className?: string;
  profileImage?: string | null;
  fallbackText?: string;
  userId?: string;
}

export const UserAvatar = ({
  className,
  profileImage,
  size = 16,
  fallbackText,
  userId
}: Props) => {
  return (
    <div
      className={cn(
        "h-16 w-16 bg-muted rounded-full flex justify-center items-center text-muted-foreground relative overflow-hidden",
        className
      )}
    >
      {profileImage ? (
        <Image src={profileImage} fill alt="Profile Avatar" priority />
      ) : fallbackText ? (
        <span className={cn(
          "text-sm font-medium text-white w-full h-full flex items-center justify-center rounded-full",
          userId ? getRandomColor(userId) : "bg-primary"
        )}>
          {fallbackText}
        </span>
      ) : (
        <User size={size} />
      )}
    </div>
  );
};
