import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { recordDSAQuestionCompletion } from '@/lib/points';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      questionId,
      status,
      timeSpent = 0,
      notes,
      approach,
      rating
    } = body;

    if (!questionId || !status) {
      return NextResponse.json(
        { error: 'Question ID and status are required' },
        { status: 400 }
      );
    }

    // Check if question exists
    const question = await db.dSAQuestion.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check if progress already exists
    const existingProgress = await db.dSAProgress.findUnique({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId
        }
      }
    });

    console.log('🔍 Progress API - Existing progress:', existingProgress);
    console.log('🔍 Progress API - New status:', status);

    let progress;
    
    if (existingProgress) {
      // Update existing progress
      progress = await db.dSAProgress.update({
        where: {
          userId_questionId: {
            userId: session.user.id,
            questionId
          }
        },
        data: {
          status,
          attempts: status === 'COMPLETED' ? existingProgress.attempts + 1 : existingProgress.attempts,
          timeSpent: existingProgress.timeSpent + timeSpent,
          notes,
          approach,
          rating,
          completedAt: status === 'COMPLETED' ? new Date() : existingProgress.completedAt
        },
        include: {
          question: {
            select: {
              title: true,
              topic: true
            }
          }
        }
      });
      console.log('🔍 Progress API - Updated progress:', progress);
    } else {
      // Create new progress
      progress = await db.dSAProgress.create({
        data: {
          userId: session.user.id,
          questionId,
          status,
          attempts: status === 'COMPLETED' ? 1 : 0,
          timeSpent,
          notes,
          approach,
          rating,
          completedAt: status === 'COMPLETED' ? new Date() : null
        },
        include: {
          question: {
            select: {
              title: true,
              topic: true
            }
          }
        }
      });
      console.log('🔍 Progress API - Created progress:', progress);
    }

    // Award points for completion
    let pointsAwarded = 0;
    let totalPoints: number | null = null;
    if (status === 'COMPLETED' && (!existingProgress || existingProgress.status !== 'COMPLETED')) {
      try {
        const awarded = await recordDSAQuestionCompletion(
          session.user.id,
          questionId,
          question.title,
          question.difficulty as 'EASY' | 'MEDIUM' | 'HARD'
        );
        pointsAwarded = awarded.transaction.points;
        totalPoints = awarded.user.points;
      } catch (error) {
        console.error('Error recording points for DSA question completion:', error);
        // Don't fail the entire request if points recording fails
      }
    }

    return NextResponse.json({
      success: true,
      progress,
      pointsAwarded,
      totalPoints,
      message: status === 'COMPLETED' ? 'Question marked as completed!' : 'Progress updated!'
    });

  } catch (error) {
    console.error('Error updating DSA progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
