import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type IncomingMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type GeminiApiErrorShape = {
  error?: {
    code?: number;
    status?: string;
    message?: string;
    details?: Array<{
      ['@type']?: string;
      retryDelay?: string;
    }>;
  };
};

const SYSTEM_PROMPT = `You are LakshyaSSB AI Mentor helping students prepare for SSB interviews.

You help with:

• NDA eligibility
• CDS entry
• PIQ form filling
• Officer Like Qualities (OLQ)
• Psychology tests (WAT, SRT, TAT)
• Lecturette topics
• Personal interview questions

You must give concise, practical answers like a mentor.

Encourage leadership, responsibility, initiative and clarity.

If user asks about LakshyaSSB features, guide them to the correct section.`;

function buildFeatureHint(userMessage: string) {
  const text = userMessage.toLowerCase();

  if (text.includes('evaluate my srt') || (text.includes('evaluate') && text.includes('srt'))) {
    return `Special output format required:
- Initiative score: X/10
- Leadership score: X/10
- Practicality score: X/10
- Suggested improvement: short actionable feedback`;
  }

  if (text.includes('lecturette topic') || text.includes('lecturette')) {
    return `Special output format required:
- Topic
- 3 Main Points (short bullets)
- Conclusion Idea (2-3 lines)`;
  }

  if (text.includes('interview question') || text.includes('interview questions')) {
    return `Special output format required:
- Provide exactly 5 SSB interview questions
- For each question, add one follow-up prompt`;
  }

  if (text.includes('where can i practice srt') || (text.includes('practice') && text.includes('srt'))) {
    return `Platform navigation hint: Mention that user can practice SRT in Practice Arena → SRT Rapid Response section.`;
  }

  return 'Keep response concise, practical, and mentorship oriented.';
}

function parseRetrySeconds(errorText: string): number | null {
  try {
    const parsed = JSON.parse(errorText) as GeminiApiErrorShape;
    const retryDelay = parsed?.error?.details?.find((d) => d?.retryDelay)?.retryDelay;
    if (!retryDelay) return null;
    const seconds = Number(String(retryDelay).replace('s', '').trim());
    return Number.isFinite(seconds) ? seconds : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body?.message || '').trim();
    const history = Array.isArray(body?.history) ? (body.history as IncomingMessage[]) : [];

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'AI service is not configured' }, { status: 500 });
    }

    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized. Please login to continue.' }, { status: 401 });
    }

    // Lookup user to enforce daily limits
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { is_pro: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.is_pro) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysMessageCount = await prisma.chatMessage.count({
        where: {
          userId: session.userId,
          role: 'user',
          createdAt: {
            gte: today,
          },
        },
      });

      if (todaysMessageCount >= 3) {
        return NextResponse.json({
          error: 'You have reached your free tier limit of 3 conversations per day. Please upgrade to Pro to continue chatting with LakshyaSSB AI Mentor.',
          reason: 'free_limit_reached'
        }, { status: 403 });
      }
    }

    // Save the User Message to DB
    await prisma.chatMessage.create({
      data: {
        userId: session.userId,
        role: 'user',
        content: message
      }
    });

    const safeHistory = history
      .slice(-5)
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const featureHint = buildFeatureHint(message);

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
    ];

    const payload = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        ...safeHistory,
        {
          role: 'user',
          parts: [
            {
              text: `User message: ${message}\n\nAdditional instruction: ${featureHint}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    };

    const attemptErrors: Array<{ model: string; status: number; error: string }> = [];

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        attemptErrors.push({ model, status: geminiRes.status, error: errText });
        continue;
      }

      const data = await geminiRes.json();
      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'I can help with SSB preparation, PIQ, psychology tests, and interview guidance. Please ask your question again briefly.';

      // Save the AI Reply to DB
      await prisma.chatMessage.create({
        data: {
          userId: session.userId,
          role: 'assistant',
          content: reply
        }
      });

      return NextResponse.json({ reply });
    }

    console.error('[CHAT_API_GEMINI_ERROR_ALL_MODELS]', attemptErrors);

    const has429 = attemptErrors.some((e) => e.status === 429);
    if (has429) {
      const retrySeconds =
        attemptErrors
          .map((e) => parseRetrySeconds(e.error))
          .find((v): v is number => typeof v === 'number') ?? null;

      return NextResponse.json(
        {
          error: retrySeconds
            ? `AI quota/rate limit reached. Please retry in about ${Math.ceil(retrySeconds)} seconds.`
            : 'AI quota/rate limit reached. Please retry shortly or upgrade API quota/billing.',
          reason: 'quota_exceeded',
          retryAfterSeconds: retrySeconds,
        },
        { status: 429 }
      );
    }

    const has404 = attemptErrors.some((e) => e.status === 404);
    if (has404) {
      return NextResponse.json(
        {
          error: 'No compatible Gemini model found for this API key/project. Check enabled models and API version access.',
          reason: 'model_not_found',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate response from AI provider.' },
      { status: 502 }
    );
  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
