import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.userId;

        // Fetch latest PIQ (0-100)
        const piq = await prisma.piqScore.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { totalScore: true },
        });

        // Fetch latest SRT (0-100 percentage)
        const srt = await prisma.srtResult.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { totalScore: true },
        });

        // Fetch latest WAT (0-100 percentage)
        const wat = await prisma.watResult.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { totalScore: true },
        });

        // Fetch latest TAT (0-100 percentage)
        const tat = await prisma.tatResult.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { totalScore: true },
        });

        const piqScore = piq?.totalScore || 0;
        const srtScore = srt?.totalScore || 0;
        const watScore = wat?.totalScore || 0;
        const tatScore = tat?.totalScore || 0;

        // Formula: ORI = (PIQ × 0.25) + (SRT × 0.25) + (WAT × 0.2) + (TAT × 0.3)
        const ori = (piqScore * 0.25) + (srtScore * 0.25) + (watScore * 0.20) + (tatScore * 0.30);

        return NextResponse.json({
            ori: Math.round(ori),
            breakdown: {
                PIQ: { score: piqScore, weight: '25%' },
                SRT: { score: srtScore, weight: '25%' },
                WAT: { score: watScore, weight: '20%' },
                TAT: { score: tatScore, weight: '30%' },
            },
        });

    } catch (error) {
        console.error('[dashboard/ori]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
