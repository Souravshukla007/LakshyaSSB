// Must come first: ES module imports are evaluated before any statement in this
// file's body, and `GEMINI_MODEL` below reads process.env at module-load time. A
// plain `dotenv.config()` call in the body would therefore run too late and the
// GEMINI_MODEL override in .env would be silently ignored. Same pattern as
// tests/test-cron.ts.
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
// Model name comes from the shared constant. This file hard-coded
// "gemini-1.5-flash", which Google retired — so the script that exists to smoke
// test Gemini would itself have 404'd while the app was perfectly healthy.
import { GEMINI_MODEL } from '../lib/ai-eval';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

async function test() {
    console.log(`Testing gemini (${GEMINI_MODEL})...`);
    try {
        const result = await model.generateContent("Say hello world");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.error("Failed:", e);
    }
}
test();
