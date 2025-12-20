// app/api/milestones/[milestoneId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{
    milestoneId: string;
  }>;
}

// PATCH /api/milestones/[milestoneId] - Toggle milestone completion
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { milestoneId } = await context.params;

    // Get the milestone and verify it belongs to the user
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        goal: {
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    if (milestone.goal.user_id !== currentUser.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Toggle the completion status
    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        completed: !milestone.completed,
        completed_at: !milestone.completed ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      milestone: updatedMilestone,
      message: milestone.completed ? 'Milestone reopened' : 'Milestone completed! 🎉',
    });

  } catch (error) {
    console.error('Error toggling milestone:', error);
    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    );
  }
}


 