import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const [totalQuestions, questionGroups, progressRows, streak] =
      await Promise.all([
        db.dSAQuestion.count({ where: { isImported: false } }),
        db.dSAQuestion.groupBy({
          by: ["topic", "difficulty"],
          where: { isImported: false },
          _count: { _all: true },
        }),
        db.dSAProgress.findMany({
          where: {
            userId,
            question: { isImported: false },
          },
          select: {
            id: true,
            status: true,
            updatedAt: true,
            question: {
              select: { title: true, topic: true, difficulty: true },
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
        calculateStreak(userId),
      ]);

    const total = totalQuestions;
    const solved = progressRows.filter((p) => p.status === "COMPLETED").length;
    const inProgress = progressRows.filter(
      (p) => p.status === "IN_PROGRESS"
    ).length;
    const todo = Math.max(0, total - solved - inProgress);
    const completionPercentage =
      total > 0 ? Math.round((solved / total) * 100) : 0;

    const topics: Record<
      string,
      { solved: number; total: number; inProgress: number }
    > = {};
    const difficulty: Record<
      string,
      { solved: number; total: number; inProgress: number }
    > = {};

    questionGroups.forEach((group) => {
      if (!topics[group.topic]) {
        topics[group.topic] = { solved: 0, total: 0, inProgress: 0 };
      }
      if (!difficulty[group.difficulty]) {
        difficulty[group.difficulty] = { solved: 0, total: 0, inProgress: 0 };
      }
      topics[group.topic].total += group._count._all;
      difficulty[group.difficulty].total += group._count._all;
    });

    progressRows.forEach((progress) => {
      const topic = topics[progress.question.topic];
      const diff = difficulty[progress.question.difficulty];

      if (progress.status === "COMPLETED") {
        if (topic) topic.solved++;
        if (diff) diff.solved++;
      } else if (progress.status === "IN_PROGRESS") {
        if (topic) topic.inProgress++;
        if (diff) diff.inProgress++;
      }
    });

    const recentActivityData = progressRows.slice(0, 5).map((activity) => ({
      id: activity.id,
      questionTitle: activity.question.title,
      topic: activity.question.topic,
      difficulty: activity.question.difficulty,
      status: activity.status,
      updatedAt: activity.updatedAt.toISOString(),
    }));

    const stats = {
      overall: {
        total,
        solved,
        inProgress,
        todo,
        completionPercentage,
      },
      topics,
      difficulty,
      recentActivity: recentActivityData,
      streak,
    };

    const response = NextResponse.json(stats, { status: 200 });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    console.error('Error fetching DSA stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function calculateStreak(userId: string): Promise<number> {
  try {
    // Get all solved curated questions ordered by completion date
    const solvedQuestions = await db.dSAProgress.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED',
        completedAt: {
          not: null
        },
        question: {
          isImported: false
        }
      },
      select: {
        completedAt: true
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    if (solvedQuestions.length === 0) {
      return 0;
    }

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Check if user solved anything today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const solvedToday = solvedQuestions.some(q => {
      if (!q.completedAt) return false;
      const completedDate = new Date(q.completedAt);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });

    if (!solvedToday) {
      // Check if solved yesterday to continue streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const solvedYesterday = solvedQuestions.some(q => {
        if (!q.completedAt) return false;
        const completedDate = new Date(q.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === yesterday.getTime();
      });

      if (!solvedYesterday) {
        return 0;
      }
      
      currentDate = yesterday;
    }

    // Count consecutive days
    for (let i = 0; i < solvedQuestions.length; i++) {
      const completedDate = new Date(solvedQuestions[i].completedAt!);
      completedDate.setHours(0, 0, 0, 0);

      if (completedDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (completedDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}
