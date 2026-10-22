"use client";

import { Clear } from "./Clear";
import { Filter } from "./Filter";
import { ActiveFilteredUser } from "./activeFilteredUsersAndTags/ActiveFilteredUser";
import { ActiveFilteredTag } from "./activeFilteredUsersAndTags/ActiveFilteredTag";
import { useFilterByUsersAndTagsInWorkspace } from "@/context/FilterByUsersAndTagsInWorkspace";
import { useTranslations } from "next-intl";

interface Props {
  sessionUserId: string;
}

export const FilterContainer = ({ sessionUserId }: Props) => {
  const { filterAssignedUsers, filterTags } =
    useFilterByUsersAndTagsInWorkspace();
  const t = useTranslations("WORKSPACE_MAIN_PAGE.FILTER");

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-border pb-4">
      <span className="eyebrow mr-1">{t("TITLE")}</span>
      <Filter sessionUserId={sessionUserId} />
      {filterAssignedUsers.map((user) => (
        <ActiveFilteredUser
          key={user.id}
          id={user.id}
          image={user.image}
          username={user.username}
        />
      ))}
      {filterTags.map((tag) => (
        <ActiveFilteredTag tag={tag} key={tag.id} />
      ))}
      {(filterAssignedUsers.length > 0 || filterTags.length > 0) && <Clear />}
    </div>
  );
};
