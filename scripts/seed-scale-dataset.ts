import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USER_COUNT = Number(process.env.SCALE_USERS || 120);
const ORG_COUNT = 8;
const WEEKS = 13;
const TASKS_PER_WEEK = 12;
const PASSWORD = "ScaleTest123!";
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20261022);
const randInt = (min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));
const pick = <T,>(items: T[]): T => items[randInt(0, items.length - 1)];
const chance = (probability: number) => random() < probability;
const pad = (value: number, width = 3) => String(value).padStart(width, "0");

const startOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};
const addDays = (value: Date, days: number) =>
  new Date(value.getTime() + days * DAY);
const addHours = (value: Date, hours: number) =>
  new Date(value.getTime() + hours * HOUR);
const clamp = (value: Date, max: Date) =>
  value.getTime() > max.getTime() ? new Date(max) : value;

async function createManyInChunks(
  delegate: { createMany: (args: any) => Promise<unknown> },
  data: any[],
  chunkSize = 500
) {
  for (let index = 0; index < data.length; index += chunkSize) {
    await delegate.createMany({
      data: data.slice(index, index + chunkSize),
      skipDuplicates: true,
    });
  }
}

const noteTitles = [
  "Weekly review",
  "Product direction",
  "Interview notes",
  "Launch checklist",
  "Architecture decisions",
  "Reading list",
  "Customer feedback",
  "Team retro",
  "Hiring scorecard",
  "Design critique",
  "Roadmap thoughts",
  "Release notes",
];

const noteBodies = [
  "Keep the next release small and predictable. The team should leave this week with one clear priority.",
  "The strongest theme in the feedback is speed. People want fewer steps between opening a workspace and finishing a task.",
  "Open questions: what do we measure this quarter, and which of these ideas is worth saying no to?",
  "A working session is better than a status meeting. Bring the unfinished thing, not the slide deck.",
  "Review the edge cases before polishing the surface. The empty states and error paths matter just as much.",
  "Use the first hour for the hardest problem. Leave the inbox and notifications for later.",
];

const taskTitles = [
  "Ship the onboarding copy",
  "Review the dashboard metrics",
  "Draft the weekly brief",
  "Polish the empty states",
  "Fix the calendar timezone edge case",
  "Prepare customer interview notes",
  "Refactor the task list query",
  "Plan the next sprint",
  "Audit notification copy",
  "Write release notes",
  "Review pull requests",
  "Clean up the design tokens",
  "Run the usability session",
  "Update the help centre article",
  "Pair on the payment flow",
  "Triage the bug queue",
  "Document the API changes",
  "Test the mobile workspace view",
];

const chatMessages = [
  "Morning — I pushed the latest copy changes, can someone take a look?",
  "The dashboard numbers look much healthier after the query fix.",
  "I am picking up the calendar edge case this afternoon.",
  "Can we move standup to 10:30 today?",
  "The new empty state is a big improvement. Much calmer.",
  "I left a short note in the project doc with the decisions from yesterday.",
  "Heads up: staging will be offline for ten minutes during the deploy.",
  "The weekly review is ready when you have a moment.",
  "I found one more place where the old theme colours leak through.",
  "Let us keep the scope narrow and ship the smaller version first.",
  "The mobile navigation finally feels right to me.",
  "I added a couple of tests around task completion.",
  "If anyone is free, I would love a second pair of eyes on this query plan.",
  "The design review notes are in the canvas now.",
  "This is a good week to clear the small backlog items.",
  "The release notes are drafted; please add anything I missed.",
  "I will be offline for an hour, back before the review.",
  "Nice work on the latency improvements — the workspace feels instant.",
];

const taskEmojis = ["1f4dd", "1f4bc", "1f4ca", "1f9e0", "1f680", "1f4a1", "1f3af", "1f4da"];

function taskContent(title: string, week: number, completed: boolean) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: `${title}. Captured during week ${week + 1} of the quarter.`,
          },
        ],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Clarify the outcome before starting." }],
              },
            ],
          },
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: completed
                      ? "Share the finished work with the team."
                      : "Leave a short note for the next person.",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

async function cleanupDemoData() {
  const workspaces = await prisma.workspace.findMany({
    where: { id: { startsWith: "sc_ws_" } },
    select: { id: true },
  });
  const workspaceIds = workspaces.map((workspace) => workspace.id);

  if (workspaceIds.length > 0) {
    await prisma.chatMessage.updateMany({
      where: { workspaceId: { in: workspaceIds } },
      data: { replyToId: null },
    });
    await prisma.workspace.deleteMany({
      where: { id: { in: workspaceIds } },
    });
  }

  await prisma.user.deleteMany({ where: { id: { startsWith: "sc_user_" } } });
  await prisma.taskDate.deleteMany({ where: { id: { startsWith: "sc_td_" } } });
}

async function seed() {
  const reset = process.argv.includes("--reset");
  const cleanupOnly = process.argv.includes("--cleanup");

  if (cleanupOnly) {
    await cleanupDemoData();
    console.log("Scale dataset removed.");
    return;
  }

  const existing = await prisma.user.count({
    where: { id: { startsWith: "sc_user_" } },
  });

  if (existing > 0 && !reset) {
    console.log(
      `Scale dataset already exists (${existing} users). Run with --reset to rebuild it.`
    );
    return;
  }

  if (existing > 0) {
    console.log("Removing previous scale dataset…");
    await cleanupDemoData();
  }

  console.time("seed-scale");
  const now = new Date();
  const currentMonday = startOfDay(now);
  currentMonday.setDate(currentMonday.getDate() - ((currentMonday.getDay() + 6) % 7));
  const todayIndex = (now.getDay() + 6) % 7;

  const questions = await prisma.dSAQuestion.findMany({
    where: { isImported: false },
    select: { id: true, title: true },
    orderBy: { id: "asc" },
  });

  if (questions.length < 100) {
    throw new Error("Expected the curated DSA question set to be imported first.");
  }

  const achievements = await prisma.achievement.findMany();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const firstNames = [
    "Aarav", "Mira", "Noah", "Zara", "Ishaan", "Lena", "Kai", "Anika",
    "Ravi", "Sofia", "Dev", "Maya", "Theo", "Ira", "Arjun", "Nina",
    "Leo", "Priya", "Owen", "Sana",
  ];
  const lastNames = [
    "Shah", "Kapoor", "Menon", "Iyer", "Bose", "Rao", "Nair", "Verma",
    "Das", "Mehta", "Khan", "Reddy", "Gupta", "Patel", "Sinha",
  ];
  const orgNames = [
    "Northwind Labs",
    "Meridian Studio",
    "Atlas Guild",
    "Foundry Nine",
    "Harbor Collective",
    "Juniper Works",
    "Orbit & Co",
    "The Paper Office",
  ];
  const orgColors = ["BLUE", "EMERALD", "PURPLE", "ORANGE", "CYAN", "PINK", "LIME", "INDIGO"];

  const users = Array.from({ length: USER_COUNT }, (_, index) => {
    const userId = `sc_user_${pad(index + 1)}`;
    const isPro = index < 2 || index % 9 === 0;
    const isBusiness = index % 23 === 0;
    const plan = isBusiness ? "BUSINESS" : isPro ? "PRO" : "FREE";
    const hasPlan = plan !== "FREE";
    return {
      id: userId,
      name: firstNames[index % firstNames.length],
      surname: lastNames[Math.floor(index / firstNames.length) % lastNames.length],
      email: `scale${pad(index + 1)}@taskflow.dev`,
      username: `scale${pad(index + 1)}`,
      hashedPassword: passwordHash,
      emailVerified: addDays(now, -100),
      completedOnboarding: true,
      useCase: "WORK",
      points: 0,
      plan,
      billingInterval: hasPlan ? "MONTH" : null,
      planStartedAt: hasPlan ? addDays(now, -randInt(10, 60)) : null,
      planExpiresAt: hasPlan ? addDays(now, randInt(30, 120)) : null,
      currentStreak: randInt(18, 44),
      longestStreak: randInt(45, 70),
      lastActivityDate: new Date(now.getTime() - randInt(0, 18) * HOUR),
      lastSeen: new Date(now.getTime() - randInt(0, 18) * HOUR),
      isOnline: index % 17 === 0,
      totalTasksCompleted: 0,
      totalNotesCreated: 0,
      totalPomodoroCompleted: 0,
      currentTitle: "Member",
      profileBadges: [],
    };
  });

  await createManyInChunks(prisma.user, users);
  await createManyInChunks(
    prisma.userSettings,
    users.map((user) => ({ userId: user.id }))
  );
  await createManyInChunks(
    prisma.pomodoroSettings,
    users.map((user) => ({ userId: user.id }))
  );

  const streakTypes = ["DAILY_LOGIN", "TASK_COMPLETION", "POMODORO_SESSION", "DSA_PRACTICE"];
  await createManyInChunks(
    prisma.userStreak,
    users.flatMap((user, index) => {
      const count = user.currentStreak;
      return streakTypes.map((streakType) => ({
        userId: user.id,
        streakType,
        currentCount: count,
        longestCount: Math.max(count + randInt(4, 20), user.longestStreak),
        lastActiveDate: new Date(now.getTime() - randInt(0, 20) * HOUR),
        multiplier: 1 + Math.min(count / 100, 0.5),
      }));
    })
  );

  const groupSize = Math.ceil(USER_COUNT / ORG_COUNT);
  const orgMemberIndices: number[][] = Array.from({ length: ORG_COUNT }, () => []);

  const userOrgIndices = users.map((_, index) => {
    const primary = Math.min(Math.floor(index / groupSize), ORG_COUNT - 1);
    const secondary = (primary + 1) % ORG_COUNT;
    const tertiary = (primary + 4) % ORG_COUNT;
    orgMemberIndices[primary].push(index);
    orgMemberIndices[secondary].push(index);
    orgMemberIndices[tertiary].push(index);
    return { primary, secondary, tertiary };
  });

  const orgs = orgNames.map((name, orgIndex) => ({
    id: `sc_ws_${pad(orgIndex + 1, 2)}`,
    name,
    creatorId: users[orgMemberIndices[orgIndex][0]].id,
    color: orgColors[orgIndex],
    createdAt: addDays(now, -96 + orgIndex),
    inviteCode: crypto.randomUUID(),
    adminCode: crypto.randomUUID(),
    canEditCode: crypto.randomUUID(),
    readOnlyCode: crypto.randomUUID(),
  }));

  await createManyInChunks(prisma.workspace, orgs);

  const channelNames = ["general", "standup", "ship-room"];
  const channels = orgs.flatMap((org, orgIndex) =>
    channelNames.map((name, channelIndex) => ({
      id: `sc_ch_${pad(orgIndex + 1, 2)}_${name}`,
      name,
      type: "TEXT",
      workspaceId: org.id,
      order: channelIndex,
      createdAt: addDays(now, -95),
    }))
  );
  await createManyInChunks(prisma.channel, channels);

  const subscriptions: any[] = [];
  const orgMembers: any[][] = Array.from({ length: ORG_COUNT }, () => []);
  const roleFor = (orgIndex: number, userIndex: number, isPrimary: boolean) => {
    if (isPrimary) {
      const firstPrimary = Math.floor(userIndex / groupSize) * groupSize;
      if (userIndex === firstPrimary) return "OWNER";
      if (userIndex < firstPrimary + 3) return "ADMIN";
      return "CAN_EDIT";
    }
    if (userIndex % 11 === 0) return "READ_ONLY";
    if (userIndex % 7 === 0) return "ADMIN";
    return "CAN_EDIT";
  };

  users.forEach((user, userIndex) => {
    const orgsForUser = userOrgIndices[userIndex];
    const memberships = [
      { orgIndex: orgsForUser.primary, role: roleFor(orgsForUser.primary, userIndex, true) },
      { orgIndex: orgsForUser.secondary, role: roleFor(orgsForUser.secondary, userIndex, false) },
      { orgIndex: orgsForUser.tertiary, role: roleFor(orgsForUser.tertiary, userIndex, false) },
    ];

    memberships.forEach(({ orgIndex, role }) => {
      subscriptions.push({
        userId: user.id,
        workspaceId: orgs[orgIndex].id,
        userRole: role,
      });
      orgMembers[orgIndex].push(user);
    });
  });

  await createManyInChunks(prisma.subscription, subscriptions);

  const taskDates: any[] = [];
  const tasks: any[] = [];
  const assignments: any[] = [];
  const savedTasks: any[] = [];
  const taskRefsByOrg: any[][] = Array.from({ length: ORG_COUNT }, () => []);
  const weeklyCompleted: number[][] = Array.from({ length: USER_COUNT }, () =>
    Array(WEEKS).fill(0)
  );
  const completedByUser = Array(USER_COUNT).fill(0);
  const createdTaskIdsByUser: string[][] = Array.from({ length: USER_COUNT }, () => []);
  const taskTitleSlots = [0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4];

  users.forEach((user, userIndex) => {
    const primary = userOrgIndices[userIndex].primary;
    const org = orgs[primary];
    const members = orgMembers[primary];

    for (let week = 0; week < WEEKS; week += 1) {
      const weekStart = addDays(currentMonday, (week - (WEEKS - 1)) * 7);
      const isCurrentWeek = week === WEEKS - 1;

      taskTitleSlots.forEach((dayOffset, slot) => {
        const isSecondSlot = slot >= 7;
        const taskDate = new Date(weekStart);
        taskDate.setDate(taskDate.getDate() + dayOffset);
        const isToday = isCurrentWeek && dayOffset === todayIndex;
        const hour = isToday ? (isSecondSlot ? 11 : 9) : isSecondSlot ? 14 : 9;
        taskDate.setHours(hour, randInt(0, 50), 0, 0);
        const isFuture = taskDate.getTime() > now.getTime();
        const mustComplete = isToday;

        const completed = mustComplete
          ? true
          : isFuture
            ? false
            : chance(isCurrentWeek ? 0.78 : 0.84);

        const completedAt = completed
          ? isToday
            ? new Date(now.getTime() - randInt(1, 5) * HOUR)
            : clamp(new Date(taskDate.getTime() + randInt(1, 4) * HOUR), now)
          : null;

        const assignee =
          chance(0.35) && members.length > 1
            ? chance(0.3)
              ? user
              : pick(members)
            : null;
        const status = completed
          ? "DONE"
          : isFuture
            ? chance(0.35) ? "IN_PROGRESS" : "TODO"
            : pick(["TODO", "IN_PROGRESS", "REVIEW", "TODO"]);
        const priority = ownPriority(slot, week);
        const taskId = `sc_tk_${pad(userIndex + 1)}_${pad(week, 2)}_${pad(slot, 2)}`;
        const dateId = `sc_td_${pad(userIndex + 1)}_${pad(week, 2)}_${pad(slot, 2)}`;
        const title = taskTitles[(userIndex + week * 3 + slot) % taskTitles.length];

        taskDates.push({
          id: dateId,
          from: taskDate.toISOString(),
          to: addHours(taskDate, 1).toISOString(),
          allDay: false,
          timeZone: "UTC",
        });

        tasks.push({
          id: taskId,
          title,
          emoji: pick(taskEmojis),
          content: taskContent(title, week, completed),
          workspaceId: org.id,
          creatorId: user.id,
          updatedUserId: completed ? (isToday ? user.id : assignee?.id ?? user.id) : user.id,
          dateId,
          isCompleted: completed,
          completedAt,
          status,
          priority,
          actualHours: completed ? Math.round(randInt(5, 25) / 10) / 1 : 0,
          estimatedHours: randInt(1, 5),
        });

        createdTaskIdsByUser[userIndex].push(taskId);
        taskRefsByOrg[primary].push({
          id: taskId,
          creatorId: user.id,
          assigneeId: assignee?.id ?? null,
          workspaceId: org.id,
          date: taskDate,
          completed,
        });

        if (completed) {
          weeklyCompleted[userIndex][week] += 1;
          completedByUser[userIndex] += 1;
        }

        if (assignee) {
          assignments.push({ userId: assignee.id, taskId });
        }
      });
    }

    const ownTasks = createdTaskIdsByUser[userIndex];
    for (let index = 0; index < Math.min(2, ownTasks.length); index += 1) {
      savedTasks.push({
        userId: user.id,
        taskId: ownTasks[(userIndex * 5 + index) % ownTasks.length],
      });
    }
  });

  function ownPriority(slot: number, week: number) {
    if ((slot + week) % 17 === 0) return "URGENT";
    if ((slot + week) % 7 === 0) return "HIGH";
    if ((slot + week) % 5 === 0) return "LOW";
    return "MEDIUM";
  }

  await createManyInChunks(prisma.taskDate, taskDates);
  await createManyInChunks(prisma.task, tasks);
  await createManyInChunks(prisma.assignedToTask, assignments);
  await createManyInChunks(prisma.savedTask, savedTasks);

  await prisma.$executeRawUnsafe(`
    UPDATE "Task" t SET
      "createdAt" = CASE
        WHEN (d."from")::timestamptz > now()
          THEN (now() - (random() * interval '10 days'))::timestamp
        ELSE LEAST((d."from")::timestamptz - interval '1 day', now())::timestamp
      END,
      "updatedAt" = CASE
        WHEN t."isCompleted" AND t."completedAt" IS NOT NULL THEN t."completedAt"
        WHEN (d."from")::timestamptz > now()
          THEN (now() - (random() * interval '5 days'))::timestamp
        ELSE LEAST((d."from")::timestamptz + interval '4 hours', now())::timestamp
      END
    FROM "TaskDate" d
    WHERE t."dateId" = d.id AND t.id LIKE 'sc_tk_%'
  `);

  const notes: any[] = [];
  users.forEach((user, userIndex) => {
    const primary = userOrgIndices[userIndex].primary;
    for (let index = 0; index < 12; index += 1) {
      const title = noteTitles[(userIndex + index) % noteTitles.length];
      const body = noteBodies[(userIndex + index * 2) % noteBodies.length];
      const createdAt =
        index === 0
          ? new Date(now.getTime() - randInt(1, 6) * HOUR)
          : addDays(now, -randInt(2, 88));
      notes.push({
        id: `sc_nt_${pad(userIndex + 1)}_${pad(index, 2)}`,
        title: `${title} · ${userIndex + 1}`,
        workspaceId: orgs[primary].id,
        authorId: user.id,
        isFavorite: index < 2,
        content: `<h2>${title}</h2><p>${body}</p><p>Owner: ${user.name}. Last touched this quarter.</p>`,
        position: index,
        createdAt,
      });
    }
  });
  await createManyInChunks(prisma.note, notes);
  await prisma.$executeRawUnsafe(`
    UPDATE "Note" SET "updatedAt" =
      LEAST("createdAt" + (random() * interval '4 days'), now()::timestamp)
    WHERE id LIKE 'sc_nt_%'
  `);

  const mindMaps: any[] = [];
  users.forEach((user, userIndex) => {
    const primary = userOrgIndices[userIndex].primary;
    for (let index = 0; index < 2; index += 1) {
      mindMaps.push({
        id: `sc_mm_${pad(userIndex + 1)}_${index}`,
        title: index === 0 ? "Quarterly planning" : "Research map",
        emoji: "1f9e0",
        workspaceId: orgs[primary].id,
        creatorId: user.id,
        updatedUserId: user.id,
        createdAt: addDays(now, -randInt(3, 88)),
      });
    }
  });
  await createManyInChunks(prisma.mindMap, mindMaps);
  await prisma.$executeRawUnsafe(`
    UPDATE "MindMap" SET "updatedAt" =
      LEAST("createdAt" + (random() * interval '3 days'), now()::timestamp)
    WHERE id LIKE 'sc_mm_%'
  `);

  const dsaProgress: any[] = [];
  const dsaCompletedByUser: number[] = [];
  users.forEach((user, userIndex) => {
    const shuffled = [...questions];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swap = randInt(0, index);
      [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
    }
    const completedCount = 62 + (userIndex % 18);
    dsaCompletedByUser.push(completedCount);

    shuffled.slice(0, completedCount).forEach((question, questionIndex) => {
      const completedAt = addDays(now, -randInt(1, 88));
      completedAt.setHours(randInt(8, 22), randInt(0, 55), 0, 0);
      dsaProgress.push({
        id: `sc_dsa_${pad(userIndex + 1)}_${pad(questionIndex, 3)}`,
        userId: user.id,
        questionId: question.id,
        status: "COMPLETED",
        attempts: randInt(1, 4),
        timeSpent: randInt(15, 120),
        rating: randInt(3, 5),
        notes: questionIndex % 7 === 0 ? "Solved with a cleaner two-pointer approach." : null,
        completedAt: clamp(completedAt, now),
      });
    });

    const extraStatuses = ["IN_PROGRESS", "REVIEW"];
    shuffled.slice(completedCount, completedCount + 8).forEach((question, extraIndex) => {
      dsaProgress.push({
        userId: user.id,
        questionId: question.id,
        status: extraStatuses[extraIndex % extraStatuses.length],
        attempts: randInt(0, 2),
        timeSpent: randInt(5, 50),
        rating: extraIndex % 2 === 0 ? randInt(2, 4) : null,
        completedAt: null,
      });
    });
  });
  await createManyInChunks(prisma.dSAProgress, dsaProgress);
  await prisma.$executeRawUnsafe(`
    UPDATE "DSAProgress" SET
      "createdAt" = CASE
        WHEN "completedAt" IS NOT NULL THEN ("completedAt" - interval '2 days')::timestamp
        ELSE (now() - interval '25 days')::timestamp
      END,
      "updatedAt" = CASE
        WHEN "completedAt" IS NOT NULL THEN "completedAt"
        ELSE (now() - (random() * interval '20 days'))::timestamp
      END
    WHERE id LIKE 'sc_dsa_%'
  `);

  const pomodoros: any[] = [];
  users.forEach((user, userIndex) => {
    const primary = userOrgIndices[userIndex].primary;
    for (let week = 0; week < WEEKS; week += 1) {
      for (let session = 0; session < 2; session += 1) {
        const weekStart = addDays(currentMonday, (week - (WEEKS - 1)) * 7);
        const completedAt = new Date(weekStart);
        completedAt.setDate(completedAt.getDate() + randInt(0, 6));
        completedAt.setHours(randInt(8, 21), randInt(0, 50), 0, 0);
        pomodoros.push({
          id: `sc_pomo_${pad(userIndex + 1)}_${pad(week, 2)}_${session}`,
          userId: user.id,
          workspaceId: orgs[primary].id,
          duration: 25,
          pointsEarned: 10,
          completedAt: clamp(completedAt, new Date(now.getTime() - randInt(1, 6) * HOUR)),
        });
      }
    }
  });
  await createManyInChunks(prisma.pomodoroSession, pomodoros);

  const messages: any[] = [];
  const mentionMessages: any[] = [];
  const messageReplies: any[] = [];
  const mentions: any[] = [];
  const reactions: any[] = [];

  orgs.forEach((org, orgIndex) => {
    const members = orgMembers[orgIndex];
    const orgChannels = channels.filter((channel) => channel.workspaceId === org.id);
    const general = orgChannels[0];

    for (let index = 0; index < 320; index += 1) {
      const channel = index % 10 < 7 ? orgChannels[0] : pick(orgChannels);
      const author = pick(members);
      const createdAt = new Date(
        now.getTime() - randInt(0, 89) * DAY - randInt(0, 23) * HOUR - randInt(0, 59) * MINUTE
      );
      const content = pick(chatMessages);
      messages.push({
        id: `sc_msg_${pad(orgIndex + 1, 2)}_${pad(index)}`,
        content,
        authorId: author.id,
        workspaceId: org.id,
        channelId: channel.id,
        createdAt,
        readByIds: members
          .filter(() => chance(0.25))
          .slice(0, 8)
          .map((member) => member.id),
      });
    }

    for (let index = 0; index < 6; index += 1) {
      const author = pick(members);
      messages.push({
        id: `sc_msg_${pad(orgIndex + 1, 2)}_recent_${index}`,
        content: pick([
          "Quick update: the latest build is on staging.",
          "I left the final notes in the workspace. Shout if anything is unclear.",
          "The review is at 4 — bring questions, not slides.",
          "Thanks for the reviews. Merging after lunch.",
          "One more edge case found in the mobile calendar; fixing now.",
          "The new palette looks excellent on the dashboard.",
        ]),
        authorId: author.id,
        workspaceId: org.id,
        channelId: general.id,
        createdAt: new Date(now.getTime() - randInt(0, 8) * HOUR - randInt(2, 50) * MINUTE),
        readByIds: members.slice(0, randInt(2, 10)).map((member) => member.id),
      });
    }

    const baseMessages = messages.filter((message) => message.workspaceId === org.id);
    for (let index = 5; index < baseMessages.length; index += 37) {
      const parent = baseMessages[index];
      messageReplies.push({
        id: `sc_rpl_${pad(orgIndex + 1, 2)}_${pad(index)}`,
        content: pick([
          "Agreed — I will take the first pass.",
          "Good catch. Let us add that to the review.",
          "On it. I will leave a note in the task.",
          "This is the right trade-off for now.",
        ]),
        authorId: pick(members).id,
        workspaceId: org.id,
        channelId: parent.channelId,
        replyToId: parent.id,
        createdAt: clamp(
          new Date(new Date(parent.createdAt).getTime() + 2 * HOUR),
          new Date(now.getTime() - 10 * MINUTE)
        ),
        readByIds: [],
      });
    }
  });

  users.forEach((user, userIndex) => {
    const primary = userOrgIndices[userIndex].primary;
    const org = orgs[primary];
    const members = orgMembers[primary];
    const author = pick(members.filter((member) => member.id !== user.id));
    const mention = {
      id: `sc_msg_mention_${pad(userIndex + 1)}`,
      content: `@${user.username} can you review the latest brief before Friday?`,
      authorId: author.id,
      workspaceId: org.id,
      channelId: `sc_ch_${pad(primary + 1, 2)}_general`,
      createdAt: new Date(now.getTime() - randInt(0, 20) * DAY - randInt(0, 12) * HOUR),
      readByIds: [],
    };
    mentionMessages.push(mention);
    mentions.push({
      messageId: mention.id,
      userId: user.id,
      read: false,
      createdAt: mention.createdAt,
    });
  });

  await createManyInChunks(prisma.chatMessage, [...messages, ...mentionMessages]);
  await createManyInChunks(prisma.chatMessage, messageReplies);
  await createManyInChunks(prisma.messageMention, mentions);

  const reactionEmojis = ["👍", "❤️", "🎉", "👀"];
  const allMessageRefs = [...messages, ...mentionMessages, ...messageReplies];
  allMessageRefs
    .filter(() => chance(0.12))
    .slice(0, 400)
    .forEach((message, index) => {
      const member = pick(orgMembers[orgs.findIndex((org) => org.id === message.workspaceId)] || []);
      if (!member) return;
      reactions.push({
        id: `sc_react_${pad(index)}`,
        emoji: pick(reactionEmojis),
        messageId: message.id,
        userId: member.id,
        createdAt: new Date(now.getTime() - randInt(0, 60) * DAY),
      });
    });
  await createManyInChunks(prisma.messageReaction, reactions);

  const notifications: any[] = [];
  users.forEach((user, userIndex) => {
    const primary = userOrgIndices[userIndex].primary;
    const orgTasks = taskRefsByOrg[primary].filter((task) => task.creatorId !== user.id);
    const recentTasks = orgTasks
      .filter((task) => now.getTime() - new Date(task.date).getTime() < 14 * DAY)
      .slice(-20);
    const pool = recentTasks.length > 0 ? recentTasks : orgTasks.slice(-20);

    for (let index = 0; index < 5; index += 1) {
      const task = pool[(userIndex * 3 + index) % pool.length];
      if (!task) continue;
      notifications.push({
        id: `sc_not_${pad(userIndex + 1)}_${index}`,
        userId: user.id,
        notifyCreatorId: task.creatorId,
        workspaceId: task.workspaceId,
        taskId: task.id,
        notifyType: index < 3 ? "NEW_ASSIGNMENT_TASK" : "NEW_TASK",
        clicked: index > 1,
        seen: index > 1,
        createdDate: new Date(now.getTime() - randInt(0, 7) * DAY - randInt(0, 20) * HOUR),
      });
    }
  });
  await createManyInChunks(prisma.notification, notifications);

  const userAchievements: any[] = [];
  const achievementTransactions: any[][] = [];
  const metricFor = (name: string, userIndex: number) => {
    const lower = name.toLowerCase();
    if (lower.includes("task")) return completedByUser[userIndex];
    if (lower.includes("note")) return 12;
    if (lower.includes("focus") || lower.includes("pomodoro")) return 26;
    if (lower.includes("code") || lower.includes("algorithm") || lower.includes("data structure") || lower.includes("elite") || lower.includes("legendary") || lower.includes("rising") || lower.includes("level")) {
      return dsaCompletedByUser[userIndex];
    }
    if (lower.includes("streak") || lower.includes("consistency") || lower.includes("dedicated") || lower.includes("unstoppable") || lower.includes("getting started")) {
      return users[userIndex].currentStreak;
    }
    if (lower.includes("team") || lower.includes("social")) return 3;
    if (lower.includes("night owl") || lower.includes("early bird") || lower.includes("weekend")) {
      return userIndex % 3 === 0 ? 1 : 0;
    }
    return 0;
  };

  users.forEach((user, userIndex) => {
    const unlocked: any[] = [];
    const inProgressNames = [
      "Data Structure Guru",
      "Note Master",
      "Focus Master",
      "Note Legend",
      "Task Legend",
      "Unstoppable Force",
      "Social Butterfly",
    ];

    achievements.forEach((achievement) => {
      const metric = metricFor(achievement.name, userIndex);
      const completed = metric >= achievement.requirement;
      const shouldShowProgress = !completed && inProgressNames.includes(achievement.name);
      if (!completed && !shouldShowProgress) return;

      const unlockedAt = new Date(now.getTime() - randInt(1, 88) * DAY);
      userAchievements.push({
        userId: user.id,
        achievementId: achievement.id,
        unlockedAt,
        progress: completed ? metric : metric,
        isCompleted: completed,
      });
      if (completed) unlocked.push({ achievement, unlockedAt });
    });

    achievementTransactions[userIndex] = unlocked.map(({ achievement, unlockedAt }, index) => ({
      userId: user.id,
      points: achievement.pointsReward,
      type: "ACHIEVEMENT_UNLOCKED",
      description: `Achievement unlocked: ${achievement.name}`,
      createdAt: unlockedAt,
      id: `sc_pt_ach_${pad(userIndex + 1)}_${pad(index, 2)}`,
    }));
  });
  await createManyInChunks(prisma.userAchievement, userAchievements);

  const pointTransactions: any[] = [];
  const finalUsers: any[] = [];

  users.forEach((user, userIndex) => {
    const transactions: any[] = [];
    for (let week = 0; week < WEEKS; week += 1) {
      const completed = weeklyCompleted[userIndex][week];
      const weekStart = addDays(currentMonday, (week - (WEEKS - 1)) * 7);
      const stamp = new Date(weekStart);
      stamp.setDate(stamp.getDate() + 6);
      stamp.setHours(18, randInt(0, 50), 0, 0);
      const createdAt = clamp(stamp, new Date(now.getTime() - randInt(1, 6) * HOUR));

      transactions.push({
        id: `sc_pt_${pad(userIndex + 1)}_${pad(week, 2)}_0`,
        userId: user.id,
        points: completed * 8,
        type: "TASK_COMPLETED",
        description: `Week ${week + 1}: ${completed} tasks completed`,
        createdAt,
      });
      transactions.push({
        id: `sc_pt_${pad(userIndex + 1)}_${pad(week, 2)}_1`,
        userId: user.id,
        points: randInt(2, 7) * 10,
        type: "DSA_QUESTION_COMPLETED",
        description: `Week ${week + 1}: DSA practice session`,
        createdAt: new Date(createdAt.getTime() - randInt(1, 20) * HOUR),
      });
      transactions.push({
        id: `sc_pt_${pad(userIndex + 1)}_${pad(week, 2)}_2`,
        userId: user.id,
        points: 20,
        type: "POMODORO_COMPLETED",
        description: `Week ${week + 1}: focus sessions`,
        createdAt: new Date(createdAt.getTime() - randInt(1, 30) * HOUR),
      });
      if (completed > 0) {
        transactions.push({
          id: `sc_pt_${pad(userIndex + 1)}_${pad(week, 2)}_3`,
          userId: user.id,
          points: 15,
          type: "STREAK_BONUS",
          description: `Week ${week + 1}: consistency bonus`,
          createdAt: new Date(createdAt.getTime() - randInt(1, 10) * HOUR),
        });
      }
    }

    transactions.push(...achievementTransactions[userIndex]);
    pointTransactions.push(...transactions);

    const points = transactions.reduce((sum, transaction) => sum + transaction.points, 0);
    const level = Math.min(25, 1 + Math.floor(points / 1000));
    finalUsers.push({
      ...user,
      points,
      experience: points,
      level,
      currentTitle: level >= 8 ? "Principal" : level >= 5 ? "Specialist" : "Contributor",
      totalTasksCompleted: completedByUser[userIndex],
      totalNotesCreated: 12,
      totalPomodoroCompleted: 26,
      currentStreak: users[userIndex].currentStreak,
      longestStreak: users[userIndex].longestStreak,
      lastActivityDate: new Date(now.getTime() - randInt(0, 2) * DAY),
    });
  });

  await createManyInChunks(prisma.pointTransaction, pointTransactions);

  for (let start = 0; start < finalUsers.length; start += 20) {
    await Promise.all(
      finalUsers.slice(start, start + 20).map((user) =>
        prisma.user.update({
          where: { id: user.id },
          data: {
            points: user.points,
            experience: user.experience,
            level: user.level,
            currentTitle: user.currentTitle,
            totalTasksCompleted: user.totalTasksCompleted,
            totalNotesCreated: user.totalNotesCreated,
            totalPomodoroCompleted: user.totalPomodoroCompleted,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            lastActivityDate: user.lastActivityDate,
          },
        })
      )
    );
  }

  finalUsers.sort((a, b) => b.points - a.points);
  const totalPeriodStart = addDays(now, -90);
  const weeklyPeriodStart = currentMonday;
  const weeklyPeriodEnd = addDays(currentMonday, 7);
  const leaderboard: any[] = [];

  const allUsers = await prisma.user.findMany({
    select: { id: true, points: true },
  });
  const allTimeRanking = [...allUsers].sort((a, b) => b.points - a.points);
  const weeklyTotals = await prisma.pointTransaction.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: weeklyPeriodStart } },
    _sum: { points: true },
  });
  const weeklyScoreByUser = new Map(
    weeklyTotals.map((entry) => [entry.userId, entry._sum.points || 0])
  );
  const weeklyRanking = [...allUsers].sort(
    (a, b) =>
      (weeklyScoreByUser.get(b.id) || 0) - (weeklyScoreByUser.get(a.id) || 0)
  );

  await prisma.leaderboardEntry.deleteMany({});

  allTimeRanking.forEach((user, rank) => {
    leaderboard.push({
      userId: user.id,
      leaderboardType: "TOTAL_POINTS",
      period: "ALL_TIME",
      score: user.points,
      rank: rank + 1,
      periodStart: totalPeriodStart,
      periodEnd: now,
    });
  });

  weeklyRanking.forEach((user, rank) => {
    leaderboard.push({
      userId: user.id,
      leaderboardType: "TOTAL_POINTS",
      period: "WEEKLY",
      score: weeklyScoreByUser.get(user.id) || 0,
      rank: rank + 1,
      periodStart: weeklyPeriodStart,
      periodEnd: weeklyPeriodEnd,
    });
  });

  await createManyInChunks(prisma.leaderboardEntry, leaderboard);

  const summary = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      (SELECT count(*) FROM "User" WHERE id LIKE 'sc_user_%')::int AS users,
      (SELECT count(*) FROM "Workspace" WHERE id LIKE 'sc_ws_%')::int AS organizations,
      (SELECT count(*) FROM "Subscription" s JOIN "Workspace" w ON w.id = s."workspaceId" WHERE w.id LIKE 'sc_ws_%')::int AS memberships,
      (SELECT count(*) FROM "Task" WHERE id LIKE 'sc_tk_%')::int AS tasks,
      (SELECT count(*) FROM "TaskDate" WHERE id LIKE 'sc_td_%')::int AS task_dates,
      (SELECT count(*) FROM "DSAProgress" WHERE id LIKE 'sc_dsa_%')::int AS dsa_progress,
      (SELECT count(*) FROM "Note" WHERE id LIKE 'sc_nt_%')::int AS notes,
      (SELECT count(*) FROM "ChatMessage" WHERE id LIKE 'sc_msg_%' OR id LIKE 'sc_rpl_%' OR id LIKE 'sc_men_%')::int AS messages,
      (SELECT count(*) FROM "PomodoroSession" WHERE id LIKE 'sc_pomo_%')::int AS pomodoros,
      (SELECT count(*) FROM "UserAchievement" ua JOIN "User" u ON u.id = ua."userId" WHERE u.id LIKE 'sc_user_%')::int AS user_achievements,
      (SELECT count(*) FROM "LeaderboardEntry" le JOIN "User" u ON u.id = le."userId" WHERE u.id LIKE 'sc_user_%')::int AS leaderboard_entries
  `);

  const membershipCheck = await prisma.$queryRawUnsafe<any[]>(`
    SELECT min(c)::int AS min_memberships, max(c)::int AS max_memberships
    FROM (
      SELECT s."userId", count(*)::int AS c
      FROM "Subscription" s
      JOIN "Workspace" w ON w.id = s."workspaceId"
      JOIN "User" u ON u.id = s."userId"
      WHERE w.id LIKE 'sc_ws_%' AND u.id LIKE 'sc_user_%'
      GROUP BY s."userId"
    ) counts
  `);

  const dsaCheck = await prisma.$queryRawUnsafe<any[]>(`
    SELECT min(completed)::int AS min_completed, max(completed)::int AS max_completed,
           (SELECT count(*) FROM "DSAQuestion" WHERE "isImported" = false)::int AS total_questions
    FROM (
      SELECT p."userId", count(*)::int AS completed
      FROM "DSAProgress" p
      JOIN "DSAQuestion" q ON q.id = p."questionId"
      JOIN "User" u ON u.id = p."userId"
      WHERE p.status = 'COMPLETED' AND q."isImported" = false AND u.id LIKE 'sc_user_%'
      GROUP BY p."userId"
    ) counts
  `);

  const weekCheck = await prisma.$queryRawUnsafe<any[]>(`
    SELECT min(c)::int AS min_week_tasks, max(c)::int AS max_week_tasks
    FROM (
      SELECT t."creatorId", count(*)::int AS c
      FROM "Task" t
      JOIN "TaskDate" d ON d.id = t."dateId"
      JOIN "User" u ON u.id = t."creatorId"
      WHERE u.id LIKE 'sc_user_%' AND d."from"::timestamptz >= $1
      GROUP BY t."creatorId"
    ) counts
  `, currentMonday);

  console.log(JSON.stringify({
    ...summary[0],
    ...membershipCheck[0],
    ...dsaCheck[0],
    ...weekCheck[0],
    login: "scale001@taskflow.dev",
    password: PASSWORD,
  }, null, 2));
  console.timeEnd("seed-scale");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
