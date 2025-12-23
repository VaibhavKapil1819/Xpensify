// app/api/learning/courses/[id]/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/learning/courses/[id]/progress - Update course progress
export async function PUT(
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

        const body = await req.json();
        const { progress, course_data } = body;

        if (progress === undefined || progress < 0 || progress > 100) {
            return NextResponse.json(
                { error: 'Invalid progress value (must be 0-100)' },
                { status: 400 }
            );
        }

        // Find course first to verify ownership
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

        // Prepare update data
        const updateData: {
            progress: number;
            completed: boolean;
            updated_at: Date;
            course_data?: any;
        } = {
            progress: Math.round(progress),
            completed: progress >= 100,
            updated_at: new Date(),
        };

        // Only update course_data if provided and valid
        if (course_data) {
            try {
                // Validate course_data structure
                if (typeof course_data === 'object' && course_data !== null) {
                    updateData.course_data = course_data;
                } else {
                    console.warn('Invalid course_data format, keeping existing data');
                }
            } catch (error) {
                console.error('Error processing course_data:', error);
                // Continue without updating course_data
            }
        }

        // Update course
        const updatedCourse = await prisma.userCourse.update({
            where: { id: courseId },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            course: updatedCourse,
            message: 'Progress updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating progress:', error);
        return NextResponse.json(
            { 
                error: 'Failed to update progress', 
                message: error.message || 'Unknown error',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
