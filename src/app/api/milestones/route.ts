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

// POST /api/milestones - Bulk create milestones
export async function POST(request: NextRequest) {
    try {
        console.log('POST /api/milestones - Starting');

        const currentUser = await getCurrentUser();
        console.log('Current user:', currentUser?.userId);

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        console.log('Request body:', body);

        const { milestones } = body;

        if (!Array.isArray(milestones) || milestones.length === 0) {
            console.error('Invalid milestones array');
            return NextResponse.json(
                { error: 'Milestones array is required and must not be empty' },
                { status: 400 }
            );
        }

        console.log('Milestones to create:', milestones.length);

        // Verify all goals belong to the current user
        const goalIds = [...new Set(milestones.map((m: any) => m.goal_id))];
        console.log('Goal IDs:', goalIds);

        const userGoals = await prisma.goal.findMany({
            where: {
                id: { in: goalIds },
                user_id: currentUser.userId,
            },
            select: { id: true },
        });

        console.log('User goals found:', userGoals.length);

        if (userGoals.length !== goalIds.length) {
            console.error('Goals mismatch - expected:', goalIds.length, 'found:', userGoals.length);
            return NextResponse.json(
                { error: 'One or more goals not found or unauthorized' },
                { status: 403 }
            );
        }

        // Create milestones
        const milestoneData = milestones.map((m: any) => ({
            goal_id: m.goal_id,
            title: m.title,
            description: m.description || null,
            target_amount: m.target_amount,
            due_date: m.due_date ? new Date(m.due_date) : null,
            completed: false,
        }));

        console.log('Creating milestones:', milestoneData);

        const createdMilestones = await prisma.milestone.createMany({
            data: milestoneData,
        });

        console.log('Milestones created:', createdMilestones.count);

        return NextResponse.json({
            success: true,
            count: createdMilestones.count,
            message: `${createdMilestones.count} milestones created successfully`,
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating milestones:', error);
        return NextResponse.json(
            {
                error: 'Failed to create milestones',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

 