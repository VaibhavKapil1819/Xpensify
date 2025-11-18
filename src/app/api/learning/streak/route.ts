// app/api/learning/streak/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/learning/streak - Get user's learning streak
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const streak = await prisma.userStreak.findUnique({
      where: {
        user_id: currentUser.userId,
      },
    });

    return NextResponse.json({
      success: true,
      streak,
    });

  } catch (error) {
    console.error('Error fetching user streak:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user streak',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}



