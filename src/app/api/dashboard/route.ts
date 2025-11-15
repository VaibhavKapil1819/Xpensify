// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        // Get current user from JWT token
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
                primary_goal: true,
                risk_level: true,
                learning_preference: true,
                currency: true,
                created_at: true,
                updated_at: true,
            },
        });

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            );
        }

        // Load active goals
        const goals = await prisma.goal.findMany({
            where: {
                user_id: currentUser.userId,
                status: 'active',
            },
            orderBy: {
                created_at: 'desc',
            },
            select: {
                id: true,
                user_id: true,
                title: true,
                description: true,
                target_amount: true,
                current_amount: true,
                target_date: true,
                category: true,
                status: true,
                ai_completion_probability: true,
                created_at: true,
                updated_at: true,
            },
        });

        // Load streak data
        const streak = await prisma.userStreak.findUnique({
            where: { user_id: currentUser.userId },
            select: {
                id: true,
                user_id: true,
                current_streak: true,
                longest_streak: true,
                last_activity_date: true,
                total_lessons_completed: true,
                badges: true,
                created_at: true,
                updated_at: true,
            },
        });

        // Return all dashboard data
        return NextResponse.json({
            success: true,
            data: {
                profile,
                goals,
                streak,
            },
        }, { status: 200 });

    } catch (error) {
        console.error('Dashboard data loading error:', error);
        return NextResponse.json(
            { error: 'An error occurred while loading dashboard data' },
            { status: 500 }
        );
    }
}

