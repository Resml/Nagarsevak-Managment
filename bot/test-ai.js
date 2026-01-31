require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    console.log("Checking API Key...");
    const key = process.env.VITE_GEMINI_API_KEY;

    if (!key) {
        console.error("❌ ERROR: VITE_GEMINI_API_KEY is undefined or empty!");
        return;
    }

    console.log(`✅ API Key found: ${key.substring(0, 5)}...${key.slice(-3)}`);

    try {
        console.log("Initializing Gemini...");
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        console.log("Sending prompt: 'Hi'");
        const result = await model.generateContent("Hi");
        const response = await result.response;
        console.log("Response:", response.text());
        console.log("✅ AI Test Passed!");
    } catch (error) {
        console.error("❌ AI Test Failed:", error);
    }
}

test();
