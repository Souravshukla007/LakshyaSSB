import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Test database connection
        await prisma.$connect();

        return NextResponse.json({
            message: 'API is working!',
            database: 'Connected to PostgreSQL',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Database connection failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
