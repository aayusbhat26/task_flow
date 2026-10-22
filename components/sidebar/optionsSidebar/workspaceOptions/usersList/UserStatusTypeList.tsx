import { UserActiveItemList } from "@/types/extended";
import { UserStatus } from "./UserStatus";

interface Props {
  users: UserActiveItemList[];
  title: string;
  active?: boolean;
}

export const UserStatusTypeList = ({ users, title, active }: Props) => {
  if (users.length === 0) return null;

  return (
    <div>
      <p className="eyebrow">
        {title} - {users.length}
      </p>
      <div className="mt-2 flex w-full flex-col gap-0.5">
        {users.map((user) => (
          <UserStatus
            key={user.id}
            image={user.image}
            username={user.username}
            active={active}
          />
        ))}
      </div>
    </div>
  );
};
