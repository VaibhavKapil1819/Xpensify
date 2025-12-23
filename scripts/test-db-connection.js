#!/usr/bin/env node

/**
 * Test database connection and provide diagnostic information
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient();
    
    console.log('🔍 Testing database connection...\n');
    console.log('Connection URL (masked):');
    const url = process.env.DATABASE_URL || '';
    const masked = url.replace(/:([^:@]+)@/, ':****@');
    console.log(masked);
    console.log('');
    
    try {
        console.log('⏳ Attempting connection...');
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1 as test`;
        const duration = Date.now() - start;
        
        console.log(`✅ Connection successful! (${duration}ms)\n`);
        console.log('Your database connection is working correctly.');
        
        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed!\n');
        console.error('Error:', error.message);
        console.error('');
        
        if (error.message.includes("Can't reach database server")) {
            console.log('🔧 Troubleshooting steps:');
            console.log('');
            console.log('1. Check Supabase Dashboard:');
            console.log('   - Go to https://supabase.com/dashboard');
            console.log('   - Verify your project is ACTIVE (not paused)');
            console.log('   - Check if there are any service interruptions');
            console.log('');
            console.log('2. Try Direct Connection:');
            console.log('   - In Supabase Dashboard → Settings → Database');
            console.log('   - Use "Session mode" connection string (direct, not pooler)');
            console.log('   - Replace your DATABASE_URL in .env');
            console.log('');
            console.log('3. Check Network/Firewall:');
            console.log('   - Ensure port 5432 is not blocked');
            console.log('   - Try from a different network');
            console.log('');
            console.log('4. Verify Connection String:');
            console.log('   - Ensure password special characters are URL-encoded');
            console.log('   - For pooler: must include ?pgbouncer=true&connection_limit=1');
            console.log('');
        }
        
        await prisma.$disconnect();
        process.exit(1);
    }
}

testConnection();

