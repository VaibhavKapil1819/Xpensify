// app/api/goals/[goalId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
    params: Promise<{
        goalId: string;
    }>;
}

// PATCH /api/goals/[goalId] - Update a specific goal
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

        const { goalId } = await context.params;

        // Verify the goal belongs to the current user
        const existingGoal = await prisma.goal.findFirst({
            where: {
                id: goalId,
                user_id: currentUser.userId,
            },
        });

        if (!existingGoal) {
            return NextResponse.json(
                { error: 'Goal not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        console.log('PATCH request body:', body);

        // Build update data object with only valid fields
        const updateData: any = {};

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.target_amount !== undefined) updateData.target_amount = body.target_amount;
        if (body.current_amount !== undefined) updateData.current_amount = body.current_amount;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.ai_completion_probability !== undefined) updateData.ai_completion_probability = body.ai_completion_probability;
        if (body.target_date !== undefined) updateData.target_date = body.target_date ? new Date(body.target_date) : null;

        console.log('Update data:', updateData);

        // Update the goal
        const updatedGoal = await prisma.goal.update({
            where: {
                id: goalId,
            },
            data: updateData,
        });

        console.log('Goal updated successfully:', updatedGoal.id);

        return NextResponse.json({
            success: true,
            goal: updatedGoal,
            message: 'Goal updated successfully',
        });

    } catch (error) {
        console.error('Error updating goal:', error);
        return NextResponse.json(
            { error: 'Failed to update goal' },
            { status: 500 }
        );
    }
}

// DELETE /api/goals/[goalId] - Delete a specific goal
export async function DELETE(
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
        const existingGoal = await prisma.goal.findFirst({
            where: {
                id: goalId,
                user_id: currentUser.userId,
            },
        });

        if (!existingGoal) {
            return NextResponse.json(
                { error: 'Goal not found' },
                { status: 404 }
            );
        }

        // Delete associated milestones first (cascade delete)
        await prisma.milestone.deleteMany({
            where: {
                goal_id: goalId,
            },
        });

        // Delete the goal
        await prisma.goal.delete({
            where: {
                id: goalId,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Goal deleted successfully',
        });

    } catch (error) {
        console.error('Error deleting goal:', error);
        return NextResponse.json(
            { error: 'Failed to delete goal' },
            { status: 500 }
        );
    }
}