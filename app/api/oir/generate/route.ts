import { NextResponse } from 'next/server';
import analogy from '@/oir_analogy.json';
import codeDe from '@/oir_CodeDe.json';
import dice from '@/oir_Dice.json';
import dictonary from '@/oir_dictonary.json';
import number from '@/oir_number.json';
import odd from '@/oir_odd.json';
import rank from '@/oir_Rank.json';
import rearrange from '@/oir_rearrange.json';
import sym from '@/oir_sym.json';
import wordProb from '@/oir_wordProb.json';

export async function GET() {
  try {
    const allQuestions: any[] = [
      ...(Array.isArray(analogy) ? analogy : []),
      ...(Array.isArray(codeDe) ? codeDe : []),
      ...(Array.isArray(dice) ? dice : []),
      ...(Array.isArray(dictonary) ? dictonary : []),
      ...(Array.isArray(number) ? number : []),
      ...(Array.isArray(odd) ? odd : []),
      ...(Array.isArray(rank) ? rank : []),
      ...(Array.isArray(rearrange) ? rearrange : []),
      ...(Array.isArray(sym) ? sym : []),
      ...(Array.isArray(wordProb) ? wordProb : [])
    ];

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions available' },
        { status: 500 }
      );
    }

    // Step 1 - Random Question Count (35 to 50)
    const questionCount = Math.floor(Math.random() * (50 - 35 + 1)) + 35;

    // Step 2 - Random Question Pool
    // Fisher-Yates shuffle
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    // Take first N questions
    const selectedQuestions = allQuestions.slice(0, questionCount).map((q, index) => ({
      ...q,
      originalId: q.id,
      id: index + 1
    }));

    return NextResponse.json({
      success: true,
      data: selectedQuestions,
      totalQuestions: questionCount,
    });
  } catch (error) {
    console.error('Error generating OIR test:', error);
    return NextResponse.json(
      { error: 'Failed to generate test' },
      { status: 500 }
    );
  }
}
