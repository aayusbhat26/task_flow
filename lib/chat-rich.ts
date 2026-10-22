export interface ChatPollOption {
  id: string;
  label: string;
  order: number;
  voteCount: number;
  myVote: boolean;
}

export interface ChatPoll {
  id: string;
  question: string;
  allowMultiple: boolean;
  isAnonymous: boolean;
  closesAt: string | null;
  closedAt: string | null;
  isClosed: boolean;
  options: ChatPollOption[];
  totalVotes: number;
}

export interface ChatTaskCard {
  id: string;
  title: string;
  status: string;
  priority: string;
  isCompleted: boolean;
  completedAt: string | null;
  dueFrom: string | null;
  dueTo: string | null;
  assignees: Array<{
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  }>;
}

export const pollInclude = (userId: string) => ({
  options: {
    orderBy: { order: "asc" as const },
    include: {
      _count: { select: { votes: true } },
      votes: {
        where: { userId },
        select: { id: true },
      },
    },
  },
});

export const taskMessageSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  isCompleted: true,
  completedAt: true,
  taskDate: {
    select: { from: true, to: true, allDay: true },
  },
  assignedToTask: {
    select: {
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  },
} as const;

export function serializePoll(poll: any): ChatPoll | null {
  if (!poll) return null;

  const options: ChatPollOption[] = (poll.options || []).map((option: any) => ({
    id: option.id,
    label: option.label,
    order: option.order,
    voteCount: option._count?.votes ?? 0,
    myVote: Array.isArray(option.votes) && option.votes.length > 0,
  }));

  return {
    id: poll.id,
    question: poll.question,
    allowMultiple: Boolean(poll.allowMultiple),
    isAnonymous: Boolean(poll.isAnonymous),
    closesAt: poll.closesAt ? new Date(poll.closesAt).toISOString() : null,
    closedAt: poll.closedAt ? new Date(poll.closedAt).toISOString() : null,
    isClosed:
      Boolean(poll.closedAt) ||
      (poll.closesAt ? new Date(poll.closesAt).getTime() <= Date.now() : false),
    options,
    totalVotes: options.reduce((sum, option) => sum + option.voteCount, 0),
  };
}

export function serializeTask(task: any): ChatTaskCard | null {
  if (!task) return null;

  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    isCompleted: Boolean(task.isCompleted),
    completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : null,
    dueFrom: task.taskDate?.from ?? null,
    dueTo: task.taskDate?.to ?? task.taskDate?.from ?? null,
    assignees: (task.assignedToTask || []).map((assignment: any) => assignment.user),
  };
}
