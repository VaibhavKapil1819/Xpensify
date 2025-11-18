// app/api/milestones/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/milestones - Get all milestones for the current user (with optional goalId filter)
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get optional goalId from query params
        const searchParams = request.nextUrl.searchParams;
        const goalId = searchParams.get('goalId');

        // Build the query filter
        const whereClause: any = {
            goal: {
                user_id: currentUser.userId,
            },
        };

        // Add goalId filter if provided
        if (goalId) {
            whereClause.goal_id = goalId;
        }

        // Fetch milestones
        const milestones = await prisma.milestone.findMany({
            where: whereClause,
            include: {
                goal: {
                    select: {
                        id: true,
                        title: true,
                        user_id: true,
                    },
                },
            },
            orderBy: {
                due_date: 'asc',
            },
        });

        return NextResponse.json({
            success: true,
            milestones,
            count: milestones.length,
        });

    } catch (error) {
        console.error('Error loading milestones:', error);
        return NextResponse.json(
            {
                error: 'Failed to load milestones',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

