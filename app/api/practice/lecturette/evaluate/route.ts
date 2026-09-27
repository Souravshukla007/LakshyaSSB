import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/entitlement';
import { awardMedals } from '@/lib/medals';
import { claimFreeEval, releaseFreeEval } from '@/lib/practice-limit';
import { generateJson, aiErrorResponse, toScore, toStringArray } from '@/lib/ai-eval';

/** Audio bodies are large; refuse anything implausible before buffering it. */
const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB

function toTenPoint(value: unknown): number {
    const n = typeof value === 'string' ? Number(value) : value;
    if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(10, Math.round(n)));
}

function toText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

export async function POST(req: NextRequest) {
    const gate = await requireUser();
    if (gate.response) return gate.response;
    const { userId, isPro } = gate.entitlement;

    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: 'Invalid form submission' }, { status: 400 });
    }

    const audioFile = formData.get('audio');
    const topic = formData.get('topic');

    if (!(audioFile instanceof File) || typeof topic !== 'string' || !topic.trim()) {
        return NextResponse.json({ error: 'Missing audio or topic' }, { status: 400 });
    }
    if (audioFile.size === 0) {
        return NextResponse.json(
            { error: 'The recording was empty, so there is nothing to evaluate.', reason: 'empty_submission' },
            { status: 400 },
        );
    }
    if (audioFile.size > MAX_AUDIO_BYTES) {
        return NextResponse.json(
            { error: 'That recording is too large. Keep it under 15 MB.', reason: 'payload_too_large' },
            { status: 413 },
        );
    }

    const claimed = await claimFreeEval(userId, isPro, 'LECTURETTE');
    if (!claimed) {
        return NextResponse.json(
            {
                error: 'You have used your free Lecturette evaluation. Upgrade to Pro for unlimited attempts.',
                reason: 'free_limit_reached',
                upgradeUrl: '/pricing',
            },
            { status: 403 },
        );
    }

    try {
        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        const prompt = `Analyze this audio recording of a candidate delivering an SSB Lecturette speech on the topic: "${topic}".

        Provide a detailed evaluation in JSON format with the following fields:
        - transcript: Full text transcript of the speech.
        - wpm: Approximate words per minute.
        - confidence: Score from 1-10.
        - clarity: Score from 1-10.
        - tone: A short descriptive phrase of their tone (e.g., "Confident and authoritative", "Steady but slightly monotonous", "Hesitant with frequent pauses").
        - contentScore: Score from 1-10 based on relevancy and depth.
        - fillerWords: List of filler words detected (um, ah, like, etc.).
        - fillerCount: Total count of filler words.
        - feedback: An object containing:
            - strengths: What they did well.
            - weaknesses: Areas of improvement.
            - tips: Concrete tips for better performance.

        Important: Be critical but constructive as an SSB GTO (Group Testing Officer) would be.`;

        const evaluation = await generateJson({
            prompt,
            inlineData: { mimeType: audioFile.type || 'audio/webm', data: base64Audio },
            // Transcription plus scoring takes materially longer than a text-only call.
            timeoutMs: 60_000,
            validate: (parsed) => {
                const p = (parsed ?? {}) as Record<string, unknown>;
                const fb = (p.feedback ?? {}) as Record<string, unknown>;
                const fillerWords = toStringArray(p.fillerWords, 30);
                return {
                    transcript: toText(p.transcript),
                    wpm: Math.max(0, Math.round(Number(p.wpm) || 0)),
                    confidence: toTenPoint(p.confidence),
                    clarity: toTenPoint(p.clarity),
                    tone: toText(p.tone),
                    contentScore: toTenPoint(p.contentScore),
                    fillerWords,
                    fillerCount:
                        Number.isFinite(Number(p.fillerCount)) && Number(p.fillerCount) >= 0
                            ? Math.round(Number(p.fillerCount))
                            : fillerWords.length,
                    feedback: {
                        strengths: toText(fb.strengths),
                        weaknesses: toText(fb.weaknesses),
                        tips: Array.isArray(fb.tips) ? toStringArray(fb.tips) : toText(fb.tips),
                    },
                };
            },
        });

        const medalResult = await awardMedals(userId, 'practice');

        return NextResponse.json({ ...evaluation, medals: medalResult });
    } catch (error) {
        await releaseFreeEval(userId, isPro, 'LECTURETTE');
        console.error('[lecturette/evaluate]', error);
        const { body: errBody, status } = aiErrorResponse(error);
        return NextResponse.json(errBody, { status });
    }
}
