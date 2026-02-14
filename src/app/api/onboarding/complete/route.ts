// app/api/onboarding/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { RiskLevel, LearningPreference } from '@prisma/client';

const onboardingSchema = z.object({
    primaryGoal: z.string().optional(),
    riskLevel: z.enum(['conservative', 'moderate', 'aggressive']),
    knowledgeLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    interests: z.array(z.string()),
    currency: z.string().length(3),
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
        const { primaryGoal, riskLevel, knowledgeLevel, interests, currency } = onboardingSchema.parse(body);

        // Update user profile with onboarding data
        const updatedProfile = await prisma.profile.update({
            where: { id: currentUser.userId },
            data: {
                primary_goal: primaryGoal || null,
                risk_level: riskLevel as RiskLevel,
                currency: currency,
                updated_at: new Date(),
                // Also update UserLearningPreferences if we have it
                learning_preferences: {
                    upsert: {
                        create: {
                            knowledge_level: knowledgeLevel,
                            preferred_topics: interests,
                        },
                        update: {
                            knowledge_level: knowledgeLevel,
                            preferred_topics: interests,
                        }
                    }
                }
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
                update: {},
            });
        } catch (streakError) {
            console.error('Error creating user streak:', streakError);
        }

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
                        target_amount: 1000,
                    },
                });
            } catch (goalError) {
                console.error('Error creating goal:', goalError);
            }
        }

        return NextResponse.json({
            success: true,
            profile: updatedProfile,
            goal: createdGoal,
            message: 'Onboarding completed successfully',
        }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message || 'Validation error' },
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

