// app/api/learning/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Helper to check if error is a database connection error
function isDatabaseConnectionError(error: any): boolean {
    return error?.code === 'P1001' || 
           error?.message?.includes('Can\'t reach database server') ||
           error?.message?.includes('connection');
}

// GET /api/learning/preferences - Get user's learning preferences
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const preferences = await prisma.userLearningPreferences.findUnique({
            where: { user_id: currentUser.userId },
        });

        // If no preferences exist, return defaults
        if (!preferences) {
            return NextResponse.json({
                success: true,
                preferences: {
                    knowledge_level: 'beginner',
                    learning_style: 'balanced',
                    weak_areas: [],
                    preferred_topics: [],
                },
            });
        }

        return NextResponse.json({
            success: true,
            preferences,
        });

    } catch (error: any) {
        console.error('Error fetching learning preferences:', error);
        
        // Handle database connection errors gracefully
        if (isDatabaseConnectionError(error)) {
            console.warn('Database connection unavailable, returning default preferences');
            return NextResponse.json({
                success: true,
                preferences: {
                    knowledge_level: 'beginner',
                    learning_style: 'balanced',
                    weak_areas: [],
                    preferred_topics: [],
                },
                warning: 'Database temporarily unavailable',
            });
        }

        return NextResponse.json(
            {
                error: 'Failed to fetch learning preferences',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// POST /api/learning/preferences - Save/update user's learning preferences
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
        const { knowledge_level, learning_style, weak_areas, preferred_topics } = body;

        const preferences = await prisma.userLearningPreferences.upsert({
            where: { user_id: currentUser.userId },
            update: {
                ...(knowledge_level && { knowledge_level }),
                ...(learning_style && { learning_style }),
                ...(weak_areas !== undefined && { weak_areas }),
                ...(preferred_topics !== undefined && { preferred_topics }),
                updated_at: new Date(),
            },
            create: {
                user_id: currentUser.userId,
                knowledge_level: knowledge_level || 'beginner',
                learning_style: learning_style || 'balanced',
                weak_areas: weak_areas || [],
                preferred_topics: preferred_topics || [],
            },
        });

        return NextResponse.json({
            success: true,
            preferences,
            message: 'Preferences saved successfully',
        });

    } catch (error) {
        console.error('Error saving learning preferences:', error);
        return NextResponse.json(
            {
                error: 'Failed to save learning preferences',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// PATCH /api/learning/preferences - Update specific preference fields
export async function PATCH(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { weak_areas, preferred_topics } = body;

        // Get existing preferences
        const existing = await prisma.userLearningPreferences.findUnique({
            where: { user_id: currentUser.userId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Preferences not found. Please create preferences first.' },
                { status: 404 }
            );
        }

        const preferences = await prisma.userLearningPreferences.update({
            where: { user_id: currentUser.userId },
            data: {
                ...(weak_areas !== undefined && { weak_areas }),
                ...(preferred_topics !== undefined && { preferred_topics }),
                updated_at: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            preferences,
        });

    } catch (error) {
        console.error('Error updating learning preferences:', error);
        return NextResponse.json(
            {
                error: 'Failed to update learning preferences',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
