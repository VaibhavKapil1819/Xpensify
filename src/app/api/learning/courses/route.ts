// app/api/learning/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Helper to check if error is a database connection error
function isDatabaseConnectionError(error: any): boolean {
    return error?.code === 'P1001' || 
           error?.message?.includes('Can\'t reach database server') ||
           error?.message?.includes('connection');
}

// GET /api/learning/courses - Fetch all user's saved courses
export async function GET(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const courses = await prisma.userCourse.findMany({
            where: { user_id: currentUser.userId },
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                difficulty: true,
                duration: true,
                progress: true,
                completed: true,
                created_at: true,
                updated_at: true,
            },
        });

        return NextResponse.json({
            success: true,
            courses,
        });
    } catch (error: any) {
        console.error('Error fetching courses:', error);
        
        // Handle database connection errors gracefully
        if (isDatabaseConnectionError(error)) {
            console.warn('Database connection unavailable, returning empty courses list');
            return NextResponse.json({
                success: true,
                courses: [],
                warning: 'Database temporarily unavailable',
            });
        }

        return NextResponse.json(
            { error: 'Failed to fetch courses', message: error.message },
            { status: 500 }
        );
    }
}

// POST /api/learning/courses - Save a new course
export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { course } = await req.json();

        if (!course || !course.title || !course.modules) {
            return NextResponse.json(
                { error: 'Invalid course data' },
                { status: 400 }
            );
        }

        // Check if course with same title already exists
        let existingCourse;
        try {
            existingCourse = await prisma.userCourse.findFirst({
            where: {
                user_id: currentUser.userId,
                title: course.title,
            },
        });
        } catch (dbError: any) {
            if (isDatabaseConnectionError(dbError)) {
                return NextResponse.json(
                    { 
                        error: 'Database temporarily unavailable',
                        message: 'Cannot save course. Please try again when the database connection is restored.',
                    },
                    { status: 503 }
                );
            }
            throw dbError;
        }

        if (existingCourse) {
            return NextResponse.json({
                success: true,
                course: existingCourse,
                message: 'Course already exists',
            });
        }

        const savedCourse = await prisma.userCourse.create({
            data: {
                user_id: currentUser.userId,
                title: course.title,
                description: course.description || '',
                difficulty: course.difficulty || 'beginner',
                duration: course.duration,
                course_data: course,
                progress: 0,
                completed: false,
            },
        });

        return NextResponse.json({
            success: true,
            course: savedCourse,
            message: 'Course saved successfully',
        });
    } catch (error: any) {
        console.error('Error saving course:', error);
        
        if (isDatabaseConnectionError(error)) {
            return NextResponse.json(
                { 
                    error: 'Database temporarily unavailable',
                    message: 'Cannot save course. Please try again when the database connection is restored.',
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to save course', message: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/learning/courses - Delete all courses (for clearing)
export async function DELETE(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await prisma.userCourse.deleteMany({
            where: { user_id: currentUser.userId },
        });

        return NextResponse.json({
            success: true,
            message: 'All courses deleted',
        });
    } catch (error: any) {
        console.error('Error deleting courses:', error);
        return NextResponse.json(
            { error: 'Failed to delete courses', message: error.message },
            { status: 500 }
        );
    }
}
