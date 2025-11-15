// app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
        const user = await prisma.profile.findUnique({
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

    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json(
            { user: null, session: null },
            { status: 200 }
        );
    }
}

