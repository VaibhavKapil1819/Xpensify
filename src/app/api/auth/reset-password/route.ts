import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { email, otp, newPassword } = await request.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
        }

        // Verify OTP
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                email,
                token: otp,
                expires_at: {
                    gt: new Date(),
                },
            },
        });

        if (!verificationToken) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user password
        await prisma.profile.update({
            where: { email },
            data: {
                password_hash: hashedPassword,
            },
        });

        // Delete used OTP
        await prisma.verificationToken.delete({
            where: { id: verificationToken.id },
        });

        return NextResponse.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
