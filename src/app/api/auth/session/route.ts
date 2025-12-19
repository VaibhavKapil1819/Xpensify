// app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper to check if error is a database connection error
function isDatabaseConnectionError(error: any): boolean {
    return error?.code === 'P1001' || 
           error?.message?.includes('Can\'t reach database server') ||
           error?.message?.includes('connection');
}

export async function GET() {
    try {
        // Get current user from JWT token
        const tokenPayload = await getCurrentUser();

        if (!tokenPayload) {
            return NextResponse.json(
                { user: null, session: null },
                { status: 200 }
            );
        }

        // Fetch full user data from database
        let user;
        try {
            user = await prisma.profile.findUnique({
            where: { id: tokenPayload.userId },
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
        } catch (dbError: any) {
            if (isDatabaseConnectionError(dbError)) {
                console.error('Database connection error during session check:', dbError);
                // Return null session instead of error to allow app to continue
                return NextResponse.json(
                    { user: null, session: null },
                    { status: 200 }
                );
            }
            throw dbError;
        }

        if (!user) {
            return NextResponse.json(
                { user: null, session: null },
                { status: 200 }
            );
        }

        return NextResponse.json({
            user,
            session: {
                access_token: 'cookie-based',
                expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
                user,
            },
        });

    } catch (error: any) {
        // Handle database connection errors gracefully
        if (isDatabaseConnectionError(error)) {
            console.error('Database connection error during session check:', error);
            return NextResponse.json(
                { user: null, session: null },
                { status: 200 }
            );
        }

        console.error('Session check error:', error);
        return NextResponse.json(
            { user: null, session: null },
            { status: 200 }
        );
    }
}

