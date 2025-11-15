// lib/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// JWT Secret - In production, use a strong secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

export interface JWTPayload {
    userId: string;
    email: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Set auth cookie
 */
export async function setAuthCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

/**
 * Get auth cookie
 */
export async function getAuthCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get('auth-token')?.value;
}

/**
 * Clear auth cookie
 */
export async function clearAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
}

/**
 * Get current user from request
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
    const token = await getAuthCookie();
    if (!token) return null;
    return verifyToken(token);
}

