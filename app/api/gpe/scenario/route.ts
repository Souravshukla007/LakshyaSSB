import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import scenarios from '@/data/gpe_scenarios.json';
import { requireUser } from '@/lib/entitlement';

/**
 * GET /api/gpe/scenario
 *
 * Requires a signed-in user. Previously public, so the full GPE scenario bank was
 * harvestable without an account.
 */
export async function GET() {
    const gate = await requireUser();
    if (gate.response) return gate.response;

    if (!Array.isArray(scenarios) || scenarios.length === 0) {
        return NextResponse.json({ error: 'No scenarios available' }, { status: 503 });
    }

    const random = scenarios[randomInt(0, scenarios.length)];
    return NextResponse.json(random);
}
