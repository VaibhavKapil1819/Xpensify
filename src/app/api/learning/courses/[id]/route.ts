// app/api/learning/courses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/learning/courses/[id] - Get a specific course by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Handle async params (Next.js 15+) - always await params
        const resolvedParams = await params;
        const courseId = resolvedParams.id;

        if (!courseId) {
            return NextResponse.json(
                { error: 'Course ID is required' },
                { status: 400 }
            );
        }

        const course = await prisma.userCourse.findFirst({
            where: {
                id: courseId,
                user_id: currentUser.userId,
            },
        });

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            );
        }

        // Parse and validate course_data
        let courseData: any;
        try {
            if (course.course_data) {
                // If it's already an object, use it directly
                if (typeof course.course_data === 'object') {
                    courseData = course.course_data;
                } else if (typeof course.course_data === 'string') {
                    // If it's a string, try to parse it
                    courseData = JSON.parse(course.course_data);
                } else {
                    throw new Error('Invalid course_data format');
                }
            } else {
                throw new Error('Course data is missing');
            }
        } catch (error) {
            console.error('Error parsing course_data:', error);
            return NextResponse.json(
                { 
                    error: 'Failed to parse course data', 
                    message: error instanceof Error ? error.message : 'Invalid course data format'
                },
                { status: 500 }
            );
        }

        // Merge course_data with metadata for consistent structure
        const mergedCourse = {
            ...courseData,
            id: course.id,
            progress: course.progress,
            completed: course.completed,
            createdAt: course.created_at,
            updatedAt: course.updated_at,
        };

        return NextResponse.json({
            success: true,
            course: mergedCourse,
        });
    } catch (error: any) {
        console.error('Error fetching course:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch course', 
                message: error.message || 'Unknown error',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

// DELETE /api/learning/courses/[id] - Delete a specific course
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Handle async params (Next.js 15+) - always await params
        const resolvedParams = await params;
        const courseId = resolvedParams.id;

        if (!courseId) {
            return NextResponse.json(
                { error: 'Course ID is required' },
                { status: 400 }
            );
        }

        const course = await prisma.userCourse.findFirst({
            where: {
                id: courseId,
                user_id: currentUser.userId,
            },
        });

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            );
        }

        await prisma.userCourse.delete({
            where: { id: courseId },
        });

        return NextResponse.json({
            success: true,
            message: 'Course deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting course:', error);
        return NextResponse.json(
            { 
                error: 'Failed to delete course', 
                message: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
