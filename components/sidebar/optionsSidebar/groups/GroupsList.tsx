"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CreateGroup } from "./CreateGroup";
import { Group } from "@prisma/client";
import Link from "next/link";
import { Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  workspaceId: string;
}

export const GroupsList = ({ workspaceId }: Props) => {
  const pathname = usePathname();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups", workspaceId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/groups/get?workspaceId=${workspaceId}`);
      return data as Group[];
    },
  });

  if (isLoading) return <div className="h-10 w-full animate-pulse bg-muted rounded-md" />;

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex items-center justify-between px-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase">
          Groups
        </p>
        <CreateGroup workspaceId={workspaceId} />
      </div>
      <div className="flex flex-col gap-1">
        {groups?.map((group) => {
            const isActive = pathname.includes(`/groups/${group.id}`);
            return (
            <Link
                key={group.id}
                href={`/dashboard/workspace/${workspaceId}/groups/${group.id}`}
                className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors",
                isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
                )}
            >
                <Users size={14} />
                <span className="truncate">{group.name}</span>
            </Link>
            );
        })}
        {groups?.length === 0 && (
            <p className="text-xs text-muted-foreground px-2">No groups yet</p>
        )}
      </div>
    </div>
  );
};
