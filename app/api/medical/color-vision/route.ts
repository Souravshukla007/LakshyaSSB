import { NextResponse } from 'next/server';
import colorVisionData from '@/data/medical/colorVision.json';

export async function GET() {
    return NextResponse.json({ plates: colorVisionData });
}
