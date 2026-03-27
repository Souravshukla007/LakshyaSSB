import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface SSBParsedNews {
    summary: string;
    ssb_importance: string;
    gd_topic: string;
    lecturette: string;
    interview_question: string;
}

const PROMPT_TEMPLATE = `Convert the following news into SSB (Services Selection Board) preparation format.

Return ONLY valid JSON matching this exact structure, with no markdown formatting or extra text:

{
  "summary": "2-3 line summary of the news",
  "ssb_importance": "Why it matters for SSB (Defence/Strategic/Geo-political)",
  "gd_topic": "A Group Discussion topic related to this news",
  "lecturette": "A 3-minute Lecturette topic angle",
  "interview_question": "A possible Personal Interview question"
}

News Title: {TITLE}
News Content: {CONTENT}`;

/** Extract suggested retry delay (in ms) from a 429 error, defaulting to 60s. */
function getRetryDelayMs(error: any): number {
    try {
        const retryInfo = error?.errorDetails?.find(
            (d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
        );
        if (retryInfo?.retryDelay) {
            // retryDelay is a string like "27s"
            const seconds = parseFloat(retryInfo.retryDelay.replace('s', ''));
            if (!isNaN(seconds)) return Math.ceil(seconds) * 1000 + 2000; // add 2s buffer
        }
    } catch {}
    return 62000; // default to 62 seconds
}

export async function processNewsWithAI(title: string, content: string, retries = 3): Promise<SSBParsedNews | null> {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = PROMPT_TEMPLATE.replace("{TITLE}", title).replace("{CONTENT}", content);

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();
            
            const parsedData: SSBParsedNews = JSON.parse(responseText);
            
            // Validate minimum required fields
            if (parsedData.summary && parsedData.ssb_importance) {
                return parsedData;
            } else {
                throw new Error("Missing required JSON fields");
            }

        } catch (error: any) {
            console.error(`AI Processing Error for "${title}" (Attempt ${attempt + 1}):`, error);
            if (attempt === retries) {
                return null; // Skip item if all retries exhausted
            }
            const delayMs = error?.status === 429 ? getRetryDelayMs(error) : 2000;
            console.log(`Waiting ${(delayMs / 1000).toFixed(1)}s before retry...`);
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
    return null;
}
