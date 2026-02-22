import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const TARGET_ENTRIES = ['NDA', 'CDS', 'AFCAT', 'TA', 'SSC', 'NCC Special'];
const SSB_CENTERS = ['Allahabad', 'Bhopal', 'Bangalore', 'Mysore', 'Kapurthala', 'Coimbatore', 'Varanasi'];

/**
 * PATCH /api/account/profile
 * Update editable profile fields. Email cannot be changed here.
 */
export async function PATCH(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, phone, targetEntry, attemptNumber, preferredSSBCenter, autoRenew } = body;

    // Minimal validation
    if (fullName !== undefined && typeof fullName === 'string' && fullName.trim().length < 2) {
        return NextResponse.json({ error: 'Full name must be at least 2 characters' }, { status: 400 });
    }

    if (targetEntry !== undefined && targetEntry !== null && !TARGET_ENTRIES.includes(targetEntry)) {
        return NextResponse.json({ error: 'Invalid target entry' }, { status: 400 });
    }

    if (preferredSSBCenter !== undefined && preferredSSBCenter !== null && !SSB_CENTERS.includes(preferredSSBCenter)) {
        return NextResponse.json({ error: 'Invalid SSB center' }, { status: 400 });
    }

    if (attemptNumber !== undefined && attemptNumber !== null) {
        const n = Number(attemptNumber);
        if (!Number.isInteger(n) || n < 1 || n > 10) {
            return NextResponse.json({ error: 'Attempt number must be between 1 and 10' }, { status: 400 });
        }
    }

    // Build update payload (only include provided fields)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    if (fullName !== undefined) data.fullName = fullName.trim();
    if (phone !== undefined) data.phone = phone || null;
    if (targetEntry !== undefined) data.targetEntry = targetEntry || null;
    if (attemptNumber !== undefined) data.attemptNumber = attemptNumber ? Number(attemptNumber) : null;
    if (preferredSSBCenter !== undefined) data.preferredSSBCenter = preferredSSBCenter || null;
    if (autoRenew !== undefined && typeof autoRenew === 'boolean') data.autoRenew = autoRenew;

    const updated = await prisma.user.update({
        where: { id: session.userId },
        data,
        select: {
            fullName: true,
            phone: true,
            targetEntry: true,
            attemptNumber: true,
            preferredSSBCenter: true,
            autoRenew: true,
        },
    });

    return NextResponse.json(updated);
}
