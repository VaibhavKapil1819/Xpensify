import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { RiskLevel } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await prisma.profile.findUnique({
            where: { id: currentUser.userId },
            include: {
                learning_preferences: true
            }
        });

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { fullName, primaryGoal, riskLevel, currency, knowledgeLevel } = body;

        const updatedProfile = await prisma.profile.update({
            where: { id: currentUser.userId },
            data: {
                full_name: fullName,
                primary_goal: primaryGoal,
                risk_level: riskLevel as RiskLevel,
                currency: currency,
                learning_preferences: {
                    upsert: {
                        create: {
                            knowledge_level: knowledgeLevel,
                        },
                        update: {
                            knowledge_level: knowledgeLevel,
                        }
                    }
                }
            }
        });

        return NextResponse.json(updatedProfile);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
