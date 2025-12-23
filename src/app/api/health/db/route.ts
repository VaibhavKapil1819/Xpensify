// app/api/health/db/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function analyzeDatabaseUrl(url: string | undefined): {
    type: 'pooler' | 'direct' | 'unknown';
    hasPoolerParams: boolean;
    host?: string;
    port?: string;
    suggestions: string[];
} {
    if (!url) {
        return {
            type: 'unknown',
            hasPoolerParams: false,
            suggestions: ['DATABASE_URL is not set in environment variables'],
        };
    }

    const isPooler = url.includes('pooler');
    const hasPoolerParams = url.includes('pgbouncer=true') && url.includes('connection_limit=');
    
    const urlObj = new URL(url);
    const host = urlObj.hostname;
    const port = urlObj.port || '5432';

    const suggestions: string[] = [];
    
    if (isPooler && !hasPoolerParams) {
        suggestions.push('⚠️ Pooler URL detected but missing required parameters');
        suggestions.push('Add: ?pgbouncer=true&connection_limit=1 to your connection string');
        suggestions.push('Example: postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1');
    }

    if (isPooler && hasPoolerParams && host.includes('pooler')) {
        suggestions.push('✅ Pooler configuration looks correct');
        suggestions.push('If still failing, try:');
        suggestions.push('1. Check Supabase dashboard - is project active?');
        suggestions.push('2. Try direct connection URL instead of pooler');
        suggestions.push('3. Verify network/firewall allows port 5432');
    }

    return {
        type: isPooler ? 'pooler' : 'direct',
        hasPoolerParams,
        host,
        port,
        suggestions,
    };
}

export async function GET() {
    const dbUrl = process.env.DATABASE_URL;
    const analysis = analyzeDatabaseUrl(dbUrl);

    try {
        // Test database connection with a simple query
        const startTime = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const duration = Date.now() - startTime;

        return NextResponse.json({
            status: 'connected',
            duration: `${duration}ms`,
            connection: {
                type: analysis.type,
                host: analysis.host,
                port: analysis.port,
            },
            message: 'Database connection successful',
        });
    } catch (error: any) {
        const isConnectionError = 
            error?.code === 'P1001' || 
            error?.message?.includes("Can't reach database server") ||
            error?.message?.includes('connection') ||
            error?.message?.includes('timeout');

        return NextResponse.json({
            status: 'error',
            error: isConnectionError ? 'connection_failed' : 'query_failed',
            message: error.message || 'Unknown error',
            code: error.code,
            connection: {
                type: analysis.type,
                host: analysis.host,
                port: analysis.port,
                hasPoolerParams: analysis.hasPoolerParams,
            },
            troubleshooting: process.env.NODE_ENV === 'development' 
                ? {
                    suggestions: analysis.suggestions,
                    steps: [
                        '1. Check your .env file has DATABASE_URL set',
                        '2. Verify Supabase project is active (not paused)',
                        '3. For pooler: Ensure URL includes ?pgbouncer=true&connection_limit=1',
                        '4. Try direct connection URL from Supabase dashboard',
                        '5. Restart dev server after changing .env',
                        '6. Check network/firewall allows connection to Supabase',
                    ],
                    testCommand: 'npx prisma db pull',
                }
                : undefined,
        }, { status: 503 });
    }
}

