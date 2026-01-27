
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY || '');

export const translateText = async (text: string, targetLanguage: 'mr' | 'hi'): Promise<string> => {
    if (!text || !API_KEY) return text;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Translate the following text to ${targetLanguage === 'mr' ? 'Marathi' : 'Hindi'}. 
        Return ONLY the translated text, no explanation or markdown.
        
        Text: "${text}"`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Translation Error:", error);
        return text; // Fallback to original
    }
};
