
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY || '');

// Fallback translations for common demo data
const MOCK_TRANSLATIONS: Record<string, string> = {
    "water issue": "पाणी समस्या",
    "Need help with Ration Card application": "रेशन कार्ड अर्जासाठी मदत हवी आहे",
    "Pipeline leakage video evidence": "पाईपलाईन गळतीचा व्हिडिओ पुरावा",
    "Street light not working since 3 days": "३ दिवसांपासून पथदिवे बंद आहेत",
    "Garbage pile up near school gate. Please clean immediately.": "शाळेच्या गेटजवळ कचऱ्याचे ढीग. कृपया त्वरित स्वच्छ करा.",
    "Pothole on MG Road causing traffic.": "एमजी रोडवरील खड्ड्यामुळे वाहतूक कोंडी.",
    "Medical Help": "वैद्यकीय मदत",
    "School Admission": "शाळा प्रवेश",
    "Clean": "स्वच्छ",
    "Garbage": "कचरा",
    "Water": "पाणी",
    "Road": "रस्ता",
    "Income Certificate Recommendation": "उत्पन्न दाखला शिफारस",
    "Character Certificate": "चारित्र्य दाखला",
    "Residence Certificate": "रहिवासी दाखला",
    "Electricity Bill Support": "वीज बिल मदत",
    "Medical Aid Application": "वैद्यकीय मदत अर्ज",
    "School Admission Request": "शाळा प्रवेश विनंती",
    "Garbage Garbage": "कचरा समस्या",
    "Senior Citizen Card": "ज्येष्ठ नागरिक ओळखपत्र"
};

export const translateText = async (text: string, targetLanguage: 'mr' | 'hi'): Promise<string> => {
    // 1. Check Mock/Dictionary first
    if (targetLanguage === 'mr' && MOCK_TRANSLATIONS[text]) {
        return MOCK_TRANSLATIONS[text];
    }

    // Case-insensitive check
    if (targetLanguage === 'mr') {
        const lowerText = text.toLowerCase().trim();
        const foundKey = Object.keys(MOCK_TRANSLATIONS).find(k => k.toLowerCase() === lowerText);
        if (foundKey) return MOCK_TRANSLATIONS[foundKey];
    }

    // 2. Check API Key
    if (!API_KEY) {
        console.warn("Translation skipped: No VITE_GEMINI_API_KEY found in environment");
        return text;
    }

    const modelsToTry = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro-latest"];

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = `Translate the following text to ${targetLanguage === 'mr' ? 'Marathi' : 'Hindi'}. 
            Return ONLY the translated text, no explanation or markdown.
            
            Text: "${text}"`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            return response.text().trim();
        } catch (error: any) {
            // Check if it's a 404 (Not Found) or 400 (Bad Request - likely model related)
            if (error.message?.includes('404') || error.message?.includes('not found')) {
                console.warn(`Model ${modelName} not available, trying next...`);
                continue;
            }
            // If it's another error (e.g. Quota), verify it's not critical
            console.warn(`Translation failed with ${modelName}:`, error);
        }
    }

    console.warn("All Gemini models failed. Using original text.");
    return text;
};
