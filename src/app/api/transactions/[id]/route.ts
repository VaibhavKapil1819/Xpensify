// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

// Schema for updating a transaction
const updateTransactionSchema = z.object({
    amount: z.number()
        .positive('Amount must be a positive number')
        .max(999999999.99, 'Amount too large')
        .optional(),
    type: z.enum(['income', 'expense'], {
        message: 'Type must be either income or expense'
    }).optional(),
    category: z.string()
        .min(1, 'Category is required')
        .max(100, 'Category too long')
        .trim()
        .optional(),
    description: z.string()
        .max(500, 'Description too long')
        .trim()
        .optional()
        .nullable(),
    date: z.string()
        .refine((dateStr) => {
            const date = new Date(dateStr);
            return !isNaN(date.getTime());
        }, 'Invalid date format')
        .optional(),
});

// PUT /api/transactions/[id] - Update a transaction
export async function PUT(
    request: NextRequest,
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

        const { id } = await params;
        const body = await request.json();
        const validatedData = updateTransactionSchema.parse(body);

        // Check if transaction exists and belongs to user
        const existingTransaction = await prisma.transaction.findUnique({
            where: { id },
        });

        if (!existingTransaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        if (existingTransaction.user_id !== currentUser.userId) {
            return NextResponse.json(
                { error: 'Unauthorized to modify this transaction' },
                { status: 403 }
            );
        }

        // Update the transaction
        const updateData: any = {};
        if (validatedData.amount !== undefined) updateData.amount = validatedData.amount;
        if (validatedData.type !== undefined) updateData.type = validatedData.type;
        if (validatedData.category !== undefined) updateData.category = validatedData.category.trim();
        if (validatedData.description !== undefined) updateData.description = validatedData.description?.trim() || null;
        if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date);

        const transaction = await prisma.transaction.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            transaction,
            message: 'Transaction updated successfully',
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            return NextResponse.json(
                { error: firstError?.message || 'Validation error' },
                { status: 400 }
            );
        }

        console.error('Error updating transaction:', error);
        return NextResponse.json(
            { error: 'Failed to update transaction' },
            { status: 500 }
        );
    }
}

// DELETE /api/transactions/[id] - Delete a transaction
export async function DELETE(
    request: NextRequest,
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

        const { id } = await params;

        // Check if transaction exists and belongs to user
        const existingTransaction = await prisma.transaction.findUnique({
            where: { id },
        });

        if (!existingTransaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        if (existingTransaction.user_id !== currentUser.userId) {
            return NextResponse.json(
                { error: 'Unauthorized to delete this transaction' },
                { status: 403 }
            );
        }

        // Delete the transaction
        await prisma.transaction.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Transaction deleted successfully',
        });

    } catch (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json(
            { error: 'Failed to delete transaction' },
            { status: 500 }
        );
    }
}
