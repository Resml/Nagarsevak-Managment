
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("No API Key found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        // There isn't a direct "listModels" on the instance in some SDK versions, but we can try basic generation to see specific error or try to find if there is a list method exposed on the class or similar?
        // Actually, checking SDK docs from memory, usually creation is decoupled.
        // But let's try to run a simple generate on a few variants to see which one succeeds.

        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-pro",
            "gemini-1.0-pro",
            "gemini-1.5-pro"
        ];

        console.log("Testing models with key:", API_KEY.substring(0, 10) + "...");

        for (const modelName of modelsToTry) {
            console.log(`\nTesting ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello, are you working?");
                const response = await result.response;
                console.log(`✅ SUCCESS: ${modelName}`);
                // console.log(response.text());
            } catch (error) {
                console.log(`❌ FAILED: ${modelName}`);
                console.log(`   Error: ${error.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

listModels();
