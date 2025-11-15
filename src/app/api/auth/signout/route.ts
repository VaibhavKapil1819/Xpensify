// app/api/auth/signout/route.ts
import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
    try {
        // Clear auth cookie
        await clearAuthCookie();

        return NextResponse.json(
            { message: 'Signed out successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Signout error:', error);
        return NextResponse.json(
            { error: 'An error occurred during signout' },
            { status: 500 }
        );
    }
}

