// app/api/onboarding/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { RiskLevel, LearningPreference } from '@prisma/client';

const onboardingSchema = z.object({
    primaryGoal: z.string().optional(),
    riskLevel: z.enum(['conservative', 'moderate', 'aggressive']),
    learningPreference: z.enum(['visual', 'text', 'interactive', 'mixed']),
});

export async function POST(request: NextRequest) {
    try {
        // Get current user from JWT token
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = onboardingSchema.parse(body);

        const { primaryGoal, riskLevel, learningPreference } = validatedData;

        // Update user profile with onboarding data
        const updatedProfile = await prisma.profile.update({
            where: { id: currentUser.userId },
            data: {
                primary_goal: primaryGoal || null,
                risk_level: riskLevel as RiskLevel,
                learning_preference: learningPreference as LearningPreference,
                updated_at: new Date(),
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                primary_goal: true,
                risk_level: true,
                learning_preference: true,
                currency: true,
                created_at: true,
                updated_at: true,
            },
        });

        // Create initial goal if primary goal was provided
        let createdGoal = null;
        if (primaryGoal && primaryGoal.trim()) {
            try {
                createdGoal = await prisma.goal.create({
                    data: {
                        user_id: currentUser.userId,
                        title: primaryGoal,
                        description: 'Created during onboarding',
                        category: 'savings',
                        status: 'active',
                        current_amount: 0,
                        target_amount: 10000, // Default target
                    },
                });
            } catch (goalError) {
                console.error('Error creating goal:', goalError);
                // Don't fail onboarding if goal creation fails
            }
        }

        // Initialize user streak record if it doesn't exist
        try {
            await prisma.userStreak.upsert({
                where: { user_id: currentUser.userId },
                create: {
                    user_id: currentUser.userId,
                    current_streak: 0,
                    longest_streak: 0,
                    total_lessons_completed: 0,
                    badges: [],
                },
                update: {}, // Do nothing if already exists
            });
        } catch (streakError) {
            console.error('Error creating user streak:', streakError);
            // Don't fail onboarding if streak creation fails
        }

        return NextResponse.json({
            success: true,
            profile: updatedProfile,
            goal: createdGoal,
            message: 'Onboarding completed successfully',
        }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            return NextResponse.json(
                { error: firstError?.message || 'Validation error' },
                { status: 400 }
            );
        }

        console.error('Onboarding completion error:', error);
        return NextResponse.json(
            { error: 'An error occurred while completing onboarding' },
            { status: 500 }
        );
    }
}

