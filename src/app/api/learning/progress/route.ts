// app/api/learning/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/learning/progress - Get user's learning progress
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get optional category filter from query params
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    const whereClause: any = {
      user_id: currentUser.userId,
    };

    if (category) {
      whereClause.category = category;
    }

    const progress = await prisma.learningProgress.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      progress,
      count: progress.length,
    });

  } catch (error) {
    console.error('Error fetching learning progress:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch learning progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/learning/progress - Save quiz result and update streak
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { lessonId, lessonTitle, category, completed, score, isCorrect } = body;

    // Validate required fields
    if (!lessonId || !lessonTitle || !category || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Save/Update learning progress
    const progress = await prisma.learningProgress.upsert({
      where: {
        user_id_lesson_id: {
          user_id: currentUser.userId,
          lesson_id: lessonId,
        },
      },
      update: {
        completed: completed,
        score: score,
        completed_at: completed ? new Date() : null,
      },
      create: {
        user_id: currentUser.userId,
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        category: category,
        completed: completed,
        score: score,
        completed_at: completed ? new Date() : null,
      },
    });

    // Step 2: Update user streak (only if correct answer)
    let streakData = {
      current_streak: 0,
      longest_streak: 0,
      total_lessons_completed: 0,
    };

    if (isCorrect) {
      const today = new Date().toISOString().split('T')[0];
      
      // Get or create user streak
      const existingStreak = await prisma.userStreak.findUnique({
        where: { user_id: currentUser.userId },
      });

      if (existingStreak) {
        // Calculate new streak
        const lastActivity = existingStreak.last_activity_date 
          ? new Date(existingStreak.last_activity_date).toISOString().split('T')[0]
          : null;
        
        let newStreak = existingStreak.current_streak;
        
        if (lastActivity !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastActivity === yesterdayStr) {
            // Continue streak
            newStreak = existingStreak.current_streak + 1;
          } else {
            // Streak broken, restart
            newStreak = 1;
          }
        }
        
        // Update streak
        const updatedStreak = await prisma.userStreak.update({
          where: { user_id: currentUser.userId },
          data: {
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, existingStreak.longest_streak),
            total_lessons_completed: existingStreak.total_lessons_completed + 1,
            last_activity_date: new Date(today),
            updated_at: new Date(),
          },
        });

        streakData = {
          current_streak: updatedStreak.current_streak,
          longest_streak: updatedStreak.longest_streak,
          total_lessons_completed: updatedStreak.total_lessons_completed,
        };
      } else {
        // Create new streak
        const newStreak = await prisma.userStreak.create({
          data: {
            user_id: currentUser.userId,
            current_streak: 1,
            longest_streak: 1,
            total_lessons_completed: 1,
            last_activity_date: new Date(today),
          },
        });

        streakData = {
          current_streak: newStreak.current_streak,
          longest_streak: newStreak.longest_streak,
          total_lessons_completed: newStreak.total_lessons_completed,
        };
      }
    } else {
      // Even if wrong, get current streak data
      const existingStreak = await prisma.userStreak.findUnique({
        where: { user_id: currentUser.userId },
      });

      if (existingStreak) {
        streakData = {
          current_streak: existingStreak.current_streak,
          longest_streak: existingStreak.longest_streak,
          total_lessons_completed: existingStreak.total_lessons_completed,
        };
      }
    }

    return NextResponse.json({
      success: true,
      progress,
      streak: streakData,
      message: isCorrect ? 'Progress saved! 🎉' : 'Keep practicing!',
    });

  } catch (error) {
    console.error('Error saving learning progress:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save learning progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}



