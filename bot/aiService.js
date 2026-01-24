require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function answerQuery(schemeName, schemeDetails, userQuestion) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
    You are a helpful government assistant for the "Nagar Sevak" (City Council) office.
    
    Context:
    The user is asking about the scheme: "${schemeName}".
    Here are the official details:
    ${JSON.stringify(schemeDetails, null, 2)}
    
    User Question: "${userQuestion}"
    
    Instructions:
    1. Answer ONLY based on the provided context.
    2. Be polite, concise, and helpful.
    3. If the answer is not in the details, say "I don't have that specific information, please visit the ward office."
    4. Keep the response under 50 words if possible for WhatsApp readability.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Error:", error);
        return "Sorry, I am having trouble connecting to the AI server right now. Please try again later.";
    }
}

async function getChatResponse(userMessage) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Act as a warm, professional, and empathetic personal assistant to the "Nagar Sevak" (City Council Member) of Ward 12, Shivaji Nagar.
        
        The user has sent a message on WhatsApp. 
        User Message: "${userMessage}"
        
        Your Goal:
        1. Reply in a way that feels like a real human staff member is talking.
        2. Be polite, respectful, and helpful.
        3. If they are greeting (Hi/Hello), welcome them warmly to the Nagar Sevak's Digital Helpdesk.
        4. If they ask about the office location, say: "Our Ward Office is located near Shivaji Park, Main Building. Open Mon-Sat 10 AM - 6 PM."
        5. If they seem angry or frustrated, apologize and assure them we are listening.
        6. Keep it short (under 60 words) and suitable for WhatsApp.
        7. Use emojis like 🙏, 🏛️, 😊 to make it friendly.
        8. Do not make up fake promises.
        
        Response:
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Chat Error:", error);
        return "Thank you for contacting us. Our automated system is currently busy, but we have noted your message. 🙏";
    }
}

module.exports = {
    answerQuery,
    getChatResponse
};
