import { NextResponse } from 'next/server';
import scenarios from '@/data/gpe_scenarios.json';

export async function GET() {
    const random = scenarios[Math.floor(Math.random() * scenarios.length)];
    return NextResponse.json(random);
}
