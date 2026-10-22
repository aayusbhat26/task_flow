"use client";

import ActiveLink from "@/components/ui/active-link";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Workspace } from "@prisma/client";
import { LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AssignedToMeWorkspace } from "./AssignedToMeWorkspace";
import { useGetAssignedToMeParams } from "@/hooks/useGetAssignedToMeParams";
import { useState } from "react";

interface Props {
  userWorkspaces: Workspace[];
}

const RADIO_OPTIONS = [
  {
    id: "all",
    label: "All",
  },
  {
    id: "tasks",
    label: "Tasks",
  },
  {
    id: "mind-maps",
    label: "Mind Maps",
  },
] as const;

export const AssignedToMeFilter = ({ userWorkspaces }: Props) => {
  const { currentType, workspaceFilterParam } = useGetAssignedToMeParams();
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const handleRadioChange = async (value: "all" | "tasks" | "mind-maps") => {
    setIsLoading(true);
    let link = `/${locale}/dashboard/assigned-to-me`;

    workspaceFilterParam
      ? (link = `/${locale}/dashboard/assigned-to-me?workspace=${workspaceFilterParam}&type=${value}`)
      : (link = `/${locale}/dashboard/assigned-to-me?workspace=all&type=${value}`);

    await router.replace(link);
    setIsLoading(false);
  };
  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <p className="eyebrow">
          Type
        </p>
        <div className="flex w-full flex-col gap-0.5">
          <RadioGroup
            value={currentType}
            onValueChange={handleRadioChange}
            defaultValue={currentType}
          >
            {RADIO_OPTIONS.map((radio) => (
              <div
                key={radio.id}
                className="flex items-center space-x-2 h-9 rounded-md px-3 transition-colors duration-200 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={(e) => {
                  const button = e.currentTarget
                    ?.firstChild as HTMLButtonElement;

                  const id = button.id as "all" | "mind-maps" | "tasks" | null;
                  id && handleRadioChange(id);
                }}
              >
                <RadioGroupItem
                  className="scale-75 md:scale-90"
                  value={radio.id}
                  id={radio.id}
                />
                <Label className="cursor-pointer" htmlFor={radio.id}>
                  {radio.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      <div>
        <p className="eyebrow">
          Workspace
        </p>
        <div className="flex flex-col gap-2 w-full mt-2">
          <ActiveLink
            href={`/${locale}/dashboard/assigned-to-me?workspace=all&type=${currentType}`}
            variant={"ghost"}
            size={"sm"}
            className={`w-full flex justify-start items-center gap-2 overflow-hidden ${
              !workspaceFilterParam || workspaceFilterParam === "all"
                ? "bg-secondary font-semibold"
                : ""
            }`}
            disableActiveStateColor
          >
            <div
              className="flex h-7 w-7 items-center justify-center bg-foreground text-background"
            >
              <LayoutGrid size={18} />
            </div>
            <p>All workspaces</p>
          </ActiveLink>
          {userWorkspaces.map((workspace) => (
            <AssignedToMeWorkspace
              currentType={currentType}
              workspaceFilterParam={workspaceFilterParam}
              key={workspace.id}
              href="/dashboard/assigned-to-me"
              workspace={workspace}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
