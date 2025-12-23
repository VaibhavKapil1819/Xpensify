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

// Helper to check if error is a database connection error
function isDatabaseConnectionError(error: any): boolean {
    return error?.code === 'P1001' || 
           error?.message?.includes('Can\'t reach database server') ||
           error?.message?.includes('connection');
}

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json();
        const validatedData = signUpSchema.parse(body);

        const { email, password, fullName } = validatedData;

        // Check if user already exists
        let existingUser;
        try {
            existingUser = await prisma.profile.findUnique({
            where: { email },
        });
        } catch (dbError: any) {
            if (isDatabaseConnectionError(dbError)) {
                console.error('Database connection error during signup:', dbError);
                return NextResponse.json(
                    { 
                        error: 'Database temporarily unavailable',
                        message: 'Unable to create account. Please check your database connection and try again later.',
                    },
                    { status: 503 }
                );
            }
            throw dbError;
        }

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        let user;
        try {
            user = await prisma.profile.create({
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
        } catch (dbError: any) {
            if (isDatabaseConnectionError(dbError)) {
                console.error('Database connection error during user creation:', dbError);
                return NextResponse.json(
                    { 
                        error: 'Database temporarily unavailable',
                        message: 'Unable to create account. Please check your database connection and try again later.',
                    },
                    { status: 503 }
                );
            }
            throw dbError;
        }

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

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            return NextResponse.json(
                { error: firstError?.message || 'Validation error' },
                { status: 400 }
            );
        }

        // Handle database connection errors
        if (isDatabaseConnectionError(error)) {
            console.error('Database connection error during signup:', error);
            return NextResponse.json(
                { 
                    error: 'Database temporarily unavailable',
                    message: 'Unable to create account. Please check your database connection and try again later.',
                },
                { status: 503 }
            );
        }

        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'An error occurred during signup', message: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

