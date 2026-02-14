import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/nodemailer';
import { z } from 'zod';

const sendOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = sendOtpSchema.parse(body);

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

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Store OTP in database (clean up old ones for this email first)
        await prisma.verificationToken.deleteMany({
            where: { email }
        });

        await prisma.verificationToken.create({
            data: {
                email,
                token: otp,
                expires_at: expiresAt,
            }
        });

        // Send email
        await sendOTPEmail(email, otp);

        return NextResponse.json({ message: 'Verification OTP sent to your email.' });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error('Signup OTP error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
