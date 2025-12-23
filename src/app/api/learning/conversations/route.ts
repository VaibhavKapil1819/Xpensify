// app/api/learning/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Helper to check if error is a database connection error
function isDatabaseConnectionError(error: any): boolean {
    return error?.code === 'P1001' || 
           error?.message?.includes('Can\'t reach database server') ||
           error?.message?.includes('connection');
}

// GET /api/learning/conversations - Get user's conversation history
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
        const limit = parseInt(searchParams.get('limit') || '50');

        const conversations = await prisma.learningConversation.findMany({
            where: { user_id: currentUser.userId },
            orderBy: { created_at: 'desc' },
            take: limit,
        });

        // Reverse to get chronological order (oldest first)
        const chronological = conversations.reverse();

        return NextResponse.json({
            success: true,
            conversations: chronological,
            count: chronological.length,
        });

    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        
        // Handle database connection errors gracefully
        if (isDatabaseConnectionError(error)) {
            console.warn('Database connection unavailable, returning empty conversations');
            return NextResponse.json({
                success: true,
                conversations: [],
                count: 0,
                warning: 'Database temporarily unavailable',
            });
        }

        return NextResponse.json(
            {
                error: 'Failed to fetch conversations',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// POST /api/learning/conversations - Save a new conversation message
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
        const { role, content, metadata } = body;

        if (!role || !content) {
            return NextResponse.json(
                { error: 'Missing required fields: role and content' },
                { status: 400 }
            );
        }

        const conversation = await prisma.learningConversation.create({
            data: {
                user_id: currentUser.userId,
                role,
                content,
                metadata: metadata || {},
            },
        });

        return NextResponse.json({
            success: true,
            conversation,
        });

    } catch (error) {
        console.error('Error saving conversation:', error);
        return NextResponse.json(
            {
                error: 'Failed to save conversation',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// DELETE /api/learning/conversations - Clear conversation history
export async function DELETE(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await prisma.learningConversation.deleteMany({
            where: { user_id: currentUser.userId },
        });

        return NextResponse.json({
            success: true,
            message: 'Conversation history cleared',
        });

    } catch (error) {
        console.error('Error clearing conversations:', error);
        return NextResponse.json(
            {
                error: 'Failed to clear conversations',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
