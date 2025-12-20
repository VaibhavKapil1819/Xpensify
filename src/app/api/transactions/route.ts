// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

// GET /api/transactions - Load all transactions for the current user
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Load all transactions for the user
    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: currentUser.userId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      transactions,
    });

  } catch (error) {
    console.error('Error loading transactions:', error);
    return NextResponse.json(
      { error: 'Failed to load transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
const createTransactionSchema = z.object({
  amount: z.number()
    .positive('Amount must be a positive number')
    .max(999999999.99, 'Amount too large'),
  type: z.enum(['income', 'expense'], {
    message: 'Type must be either income or expense'
  }),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category too long')
    .trim(),
  description: z.string()
    .max(500, 'Description too long')
    .trim()
    .optional(),
  date: z.string()
    .refine((dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    }, 'Invalid date format')
    .transform((dateStr: string) => {
      const date = new Date(dateStr);
      // Handle cases where AI might provide 2-digit years (e.g., year 24 instead of 2024)
      if (date.getFullYear() < 100) {
        date.setFullYear(date.getFullYear() + 2000);
        return date.toISOString().split('T')[0];
      }
      return dateStr;
    })
    .superRefine((dateStr: string, ctx) => {
      const date = new Date(dateStr);
      const now = new Date();
      const thirtyYearsAgo = new Date();
      thirtyYearsAgo.setFullYear(now.getFullYear() - 30);
      const tenYearsFuture = new Date();
      tenYearsFuture.setFullYear(now.getFullYear() + 10);

      if (date < thirtyYearsAgo || date > tenYearsFuture) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Date is out of range (${dateStr}). Must be between 30 years ago and 10 years future.`,
        });
      }
    }),
});

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

    // Sanitize inputs
    const sanitizedCategory = validatedData.category.trim();
    const sanitizedDescription = validatedData.description?.trim() || null;

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        user_id: currentUser.userId,
        amount: validatedData.amount,
        type: validatedData.type,
        category: sanitizedCategory,
        description: sanitizedDescription,
        date: new Date(validatedData.date),
      },
    });

    return NextResponse.json({
      success: true,
      transaction,
      message: `${validatedData.type === 'income' ? 'Income' : 'Expense'} added successfully`,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation error' },
        { status: 400 }
      );
    }

    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}




