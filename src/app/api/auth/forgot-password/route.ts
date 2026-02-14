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

        // Store OTP in database - Delete any existing OTPs for this email first
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
