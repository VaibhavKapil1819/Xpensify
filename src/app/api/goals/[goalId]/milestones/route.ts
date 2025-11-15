// app/api/goals/[goalId]/milestones/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
    params: Promise<{
        goalId: string;
    }>;
}

// GET /api/goals/[goalId]/milestones - Load milestones for a specific goal
export async function GET(
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

        const { goalId } = await context.params;

        // Verify the goal belongs to the current user
        const goal = await prisma.goal.findFirst({
            where: {
                id: goalId,
                user_id: currentUser.userId,
            },
        });

        if (!goal) {
            return NextResponse.json(
                { error: 'Goal not found' },
                { status: 404 }
            );
        }

        // Load milestones for the goal
        const milestones = await prisma.milestone.findMany({
            where: {
                goal_id: goalId,
            },
            orderBy: {
                due_date: 'asc',
            },
        });

        return NextResponse.json({
            success: true,
            milestones,
        });

    } catch (error) {
        console.error('Error loading milestones:', error);
        return NextResponse.json(
            { error: 'Failed to load milestones' },
            { status: 500 }
        );
    }
}

