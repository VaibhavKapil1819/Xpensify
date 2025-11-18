// app/api/milestones/[milestoneId]/toggle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{
    milestoneId: string;
  }>;
}

// PATCH /api/milestones/[milestoneId]/toggle - Toggle milestone completion status
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

    // Validate milestone ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(milestoneId)) {
      return NextResponse.json(
        { error: 'Invalid milestone ID format' },
        { status: 400 }
      );
    }

    // Get the milestone and verify it belongs to the user
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        goal: {
          select: {
            user_id: true,
            title: true,
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
        { error: 'Forbidden: You do not have access to this milestone' },
        { status: 403 }
      );
    }

    // Toggle the completion status
    const newCompletionStatus = !milestone.completed;
    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        completed: newCompletionStatus,
        completed_at: newCompletionStatus ? new Date() : null,
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      milestone: updatedMilestone,
      message: newCompletionStatus 
        ? 'Milestone completed! 🎉' 
        : 'Milestone reopened',
    });

  } catch (error) {
    console.error('Error toggling milestone:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update milestone',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}



