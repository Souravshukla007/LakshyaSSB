import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function test() {
    console.log("Testing gemini...");
    try {
        const result = await model.generateContent("Say hello world");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.error("Failed:", e);
    }
}
test();
