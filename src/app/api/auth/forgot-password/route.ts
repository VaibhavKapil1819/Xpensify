import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/nodemailer';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user exists
        const user = await prisma.profile.findUnique({
            where: { email },
        });

        if (!user) {
            // For security reasons, don't reveal if user exists or not
            return NextResponse.json({ message: 'If an account exists with this email, you will receive an OTP shortly.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Store OTP in database
        await prisma.verificationToken.upsert({
            where: {
                email_token: {
                    email,
                    token: otp, // This is not ideal because email_token is unique, better to delete old ones or use email as key
                },
            },
            update: {
                token: otp,
                expires_at: expiresAt,
            },
            create: {
                email,
                token: otp,
                expires_at: expiresAt,
            },
        });

        // Better logic for upsert avoiding unique constraint on token if multiple users request at same time
        // Actually, @@unique([email, token]) is what I have. If I want to allow only one active OTP per email, 
        // I should probably just delete existing ones for that email.

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

        return NextResponse.json({ message: 'If an account exists with this email, you will receive an OTP shortly.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
