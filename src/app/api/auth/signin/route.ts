// app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const signInSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json();
        const validatedData = signInSchema.parse(body);

        const { email, password } = validatedData;

        // Find user by email (including password_hash for verification)
        const user = await prisma.profile.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, user.password_hash);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
        });

        // Set auth cookie
        await setAuthCookie(token);

        // Return user data (exclude password_hash)
        const { password_hash, ...userWithoutPassword } = user;

        return NextResponse.json({
            user: userWithoutPassword,
            session: {
                access_token: token,
                expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                user: userWithoutPassword,
            },
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            return NextResponse.json(
                { error: firstError?.message || 'Validation error' },
                { status: 400 }
            );
        }

        console.error('Signin error:', error);
        return NextResponse.json(
            { error: 'An error occurred during signin' },
            { status: 500 }
        );
    }
}

