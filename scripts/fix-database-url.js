#!/usr/bin/env node

/**
 * Helper script to fix DATABASE_URL for Supabase pooler connections
 * 
 * Usage:
 *   node scripts/fix-database-url.js
 * 
 * This script will:
 * 1. Check if DATABASE_URL exists in .env
 * 2. Verify if it's a pooler URL
 * 3. Add missing pooler parameters if needed
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

function readEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
}

function writeEnvFile(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf-8');
}

function fixDatabaseUrl() {
    // Try .env.local first, then .env
    let envContent = readEnvFile(envLocalPath);
    let envFilePath = envLocalPath;

    if (!envContent) {
        envContent = readEnvFile(envPath);
        envFilePath = envPath;
    }

    if (!envContent) {
        console.error('❌ No .env or .env.local file found!');
        console.log('\n📝 Create a .env file with your DATABASE_URL:');
        console.log('   DATABASE_URL="postgresql://user:password@host:5432/dbname"');
        process.exit(1);
    }

    // Find DATABASE_URL line
    const lines = envContent.split('\n');
    let databaseUrlIndex = -1;
    let databaseUrl = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('DATABASE_URL=')) {
            databaseUrlIndex = i;
            // Extract the URL (handle quoted and unquoted values)
            const match = line.match(/^DATABASE_URL=(?:"|')(.*)(?:"|')$/) || line.match(/^DATABASE_URL=(.*)$/);
            if (match) {
                databaseUrl = match[1];
            }
            break;
        }
    }

    if (databaseUrlIndex === -1 || !databaseUrl) {
        console.error('❌ DATABASE_URL not found in .env file!');
        process.exit(1);
    }

    console.log('📋 Current DATABASE_URL:');
    console.log(`   ${databaseUrl.substring(0, 50)}...`);

    // Check if it's a pooler URL
    const isPooler = databaseUrl.includes('pooler');
    const hasPoolerParams = databaseUrl.includes('pgbouncer=true') && databaseUrl.includes('connection_limit=');

    if (!isPooler) {
        console.log('\n✅ Not a pooler URL - no changes needed');
        console.log('   (If you want to use pooler, get the pooler URL from Supabase dashboard)');
        return;
    }

    if (hasPoolerParams) {
        console.log('\n✅ Pooler parameters already present - no changes needed');
        return;
    }

    // Fix the URL
    console.log('\n⚠️  Pooler URL detected but missing required parameters');
    console.log('🔧 Fixing DATABASE_URL...');

    // Add parameters
    const separator = databaseUrl.includes('?') ? '&' : '?';
    const fixedUrl = `${databaseUrl}${separator}pgbouncer=true&connection_limit=1`;

    // Update the line
    const originalLine = lines[databaseUrlIndex];
    const quoteMatch = originalLine.match(/^DATABASE_URL=(.)/);
    const quote = quoteMatch ? quoteMatch[1] : '';
    const newLine = quote
        ? `DATABASE_URL=${quote}${fixedUrl}${quote}`
        : `DATABASE_URL=${fixedUrl}`;

    lines[databaseUrlIndex] = newLine;
    const newContent = lines.join('\n');

    // Write back
    writeEnvFile(envFilePath, newContent);

    console.log('\n✅ Fixed DATABASE_URL!');
    console.log('\n📝 Updated URL:');
    console.log(`   ${fixedUrl.substring(0, 60)}...`);
    console.log('\n⚠️  IMPORTANT: Restart your dev server for changes to take effect!');
    console.log('   Run: npm run dev');
}

try {
    fixDatabaseUrl();
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

