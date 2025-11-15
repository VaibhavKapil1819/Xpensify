// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const signUpSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(1, 'Full name is required'),
});

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json();
        const validatedData = signUpSchema.parse(body);

        const { email, password, fullName } = validatedData;

        // Check if user already exists
        const existingUser = await prisma.profile.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await prisma.profile.create({
            data: {
                email,
                password_hash: passwordHash,
                full_name: fullName,
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

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
        });

        // Set auth cookie
        await setAuthCookie(token);

        // Return user data and session
        return NextResponse.json({
            user,
            session: {
                access_token: token,
                expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                user,
            },
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            return NextResponse.json(
                { error: firstError?.message || 'Validation error' },
                { status: 400 }
            );
        }

        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'An error occurred during signup' },
            { status: 500 }
        );
    }
}

