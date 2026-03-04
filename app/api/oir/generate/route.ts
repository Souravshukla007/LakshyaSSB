import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OIR_FILES = [
  'oir_analogy.json',
  'oir_CodeDe.json',
  'oir_Dice.json',
  'oir_dictonary.json',
  'oir_number.json',
  'oir_odd.json',
  'oir_Rank.json',
  'oir_rearrange.json',
  'oir_sym.json',
  'oir_wordProb.json'
];

export async function GET() {
  try {
    const allQuestions: any[] = [];

    // Read all JSON files
    for (const fileName of OIR_FILES) {
      const filePath = path.join(process.cwd(), fileName);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        try {
          const questions = JSON.parse(fileContent);
          if (Array.isArray(questions)) {
            allQuestions.push(...questions);
          }
        } catch (parseError) {
          console.error(`Error parsing ${fileName}:`, parseError);
        }
      } else {
        console.warn(`File not found: ${filePath}`);
      }
    }

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
