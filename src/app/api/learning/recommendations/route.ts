// app/api/learning/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Helper to check if error is a database connection error
function isDatabaseConnectionError(error: any): boolean {
    return error?.code === 'P1001' || 
           error?.message?.includes('Can\'t reach database server') ||
           error?.message?.includes('connection');
}

// GET /api/learning/recommendations - Get user's topic recommendations
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const includeCompleted = searchParams.get('include_completed') === 'true';

        const whereClause: any = {
            user_id: currentUser.userId,
        };

        if (!includeCompleted) {
            whereClause.completed = false;
        }

        const recommendations = await prisma.topicRecommendation.findMany({
            where: whereClause,
            orderBy: [
                { priority: 'desc' },
                { created_at: 'desc' },
            ],
        });

        return NextResponse.json({
            success: true,
            recommendations,
            count: recommendations.length,
        });

    } catch (error: any) {
        console.error('Error fetching recommendations:', error);
        
        // Handle database connection errors gracefully
        if (isDatabaseConnectionError(error)) {
            console.warn('Database connection unavailable, returning empty recommendations');
            return NextResponse.json({
                success: true,
                recommendations: [],
                count: 0,
                warning: 'Database temporarily unavailable',
            });
        }

        return NextResponse.json(
            {
                error: 'Failed to fetch recommendations',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// POST /api/learning/recommendations - Generate new recommendations
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user's progress and preferences
        const [progress, preferences, streak] = await Promise.all([
            prisma.learningProgress.findMany({
                where: { user_id: currentUser.userId },
                orderBy: { created_at: 'desc' },
            }),
            prisma.userLearningPreferences.findUnique({
                where: { user_id: currentUser.userId },
            }),
            prisma.userStreak.findUnique({
                where: { user_id: currentUser.userId },
            }),
        ]);

        // Generate recommendations based on progress
        const completedCategories = new Set(
            progress.filter(p => p.completed).map(p => p.category).filter(Boolean)
        );

        const allTopics = [
            { id: 'budgeting', name: 'Budgeting Basics', difficulty: 'beginner' },
            { id: 'saving', name: 'Smart Saving Strategies', difficulty: 'beginner' },
            { id: 'investing', name: 'Investment Fundamentals', difficulty: 'intermediate' },
            { id: 'debt', name: 'Debt Management', difficulty: 'beginner' },
            { id: 'credit-score', name: 'Understanding Credit Scores', difficulty: 'intermediate' },
            { id: 'retirement', name: 'Retirement Planning', difficulty: 'intermediate' },
            { id: 'taxes', name: 'Tax Basics', difficulty: 'intermediate' },
            { id: 'insurance', name: 'Insurance Essentials', difficulty: 'beginner' },
            { id: 'emergency-fund', name: 'Building Emergency Funds', difficulty: 'beginner' },
            { id: 'stocks', name: 'Stock Market Basics', difficulty: 'advanced' },
        ];

        const knowledgeLevel = preferences?.knowledge_level || 'beginner';

        // Filter topics based on knowledge level and what's not completed
        const recommendedTopics = allTopics.filter(topic => {
            if (completedCategories.has(topic.id)) return false;

            if (knowledgeLevel === 'beginner') {
                return topic.difficulty === 'beginner';
            } else if (knowledgeLevel === 'intermediate') {
                return topic.difficulty === 'beginner' || topic.difficulty === 'intermediate';
            }
            return true; // advanced users see all
        });

        // Create recommendations
        const recommendations = await Promise.all(
            recommendedTopics.slice(0, 5).map((topic, index) =>
                prisma.topicRecommendation.create({
                    data: {
                        user_id: currentUser.userId,
                        topic_id: topic.id,
                        topic_name: topic.name,
                        reason: `Based on your ${knowledgeLevel} level and learning progress`,
                        priority: 5 - index,
                    },
                })
            )
        );

        return NextResponse.json({
            success: true,
            recommendations,
            message: `Generated ${recommendations.length} personalized recommendations`,
        });

    } catch (error: any) {
        console.error('Error generating recommendations:', error);
        
        // Handle database connection errors gracefully
        if (isDatabaseConnectionError(error)) {
            console.warn('Database connection unavailable, cannot generate recommendations');
            return NextResponse.json(
                {
                    error: 'Database temporarily unavailable',
                    message: 'Please try again later when the database connection is restored',
                },
                { status: 503 } // Service Unavailable
            );
        }

        return NextResponse.json(
            {
                error: 'Failed to generate recommendations',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// PATCH /api/learning/recommendations/:id - Mark recommendation as completed
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
        const { topic_id, completed } = body;

        if (!topic_id) {
            return NextResponse.json(
                { error: 'Missing topic_id' },
                { status: 400 }
            );
        }

        const recommendation = await prisma.topicRecommendation.updateMany({
            where: {
                user_id: currentUser.userId,
                topic_id: topic_id,
            },
            data: {
                completed: completed !== undefined ? completed : true,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Recommendation updated',
        });

    } catch (error) {
        console.error('Error updating recommendation:', error);
        return NextResponse.json(
            {
                error: 'Failed to update recommendation',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
