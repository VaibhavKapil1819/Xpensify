// app/api/goals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

// GET /api/goals - Load all goals for the current user
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Load profile
    const profile = await prisma.profile.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        currency: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Load all goals for the user
    const goals = await prisma.goal.findMany({
      where: {
        user_id: currentUser.userId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      goals,
      profile,
    });

  } catch (error) {
    console.error('Error loading goals:', error);
    return NextResponse.json(
      { error: 'Failed to load goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new goal
const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  target_amount: z.number().positive('Target amount must be positive'),
  current_amount: z.number().default(0),
  target_date: z.string().optional(),
  category: z.string().default('savings'),
  currency: z.string().default('USD'),
});

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
    const validatedData = createGoalSchema.parse(body);

    // Create the goal
    const goal = await prisma.goal.create({
      data: {
        user_id: currentUser.userId,
        title: validatedData.title,
        description: validatedData.description || null,
        target_amount: validatedData.target_amount,
        current_amount: validatedData.current_amount,
        target_date: validatedData.target_date ? new Date(validatedData.target_date) : null,
        category: validatedData.category,
        status: 'active',
      },
    });

    // TODO: Generate AI milestones (integrate with AI service later)
    // For now, create basic milestones
    const targetAmount = validatedData.target_amount;
    const milestoneCount = 4;
    const milestoneAmount = targetAmount / milestoneCount;

    const basicMilestones = Array.from({ length: milestoneCount }, (_, i) => ({
      goal_id: goal.id,
      title: `Milestone ${i + 1}: Save ${((i + 1) * 25)}%`,
      description: `Reach ${validatedData.currency} ${((i + 1) * milestoneAmount).toFixed(2)} towards your goal`,
      target_amount: (i + 1) * milestoneAmount,
      completed: false,
      due_date: null,
    }));

    await prisma.milestone.createMany({
      data: basicMilestones,
    });

    return NextResponse.json({
      success: true,
      goal,
      message: 'Goal created successfully',
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation error' },
        { status: 400 }
      );
    }

    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}


