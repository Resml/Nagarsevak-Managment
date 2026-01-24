import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable (see "Set up your API key" above)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

export type ContentType = 'Speech' | 'Social Media Caption' | 'Press Release' | 'Letter/Notice' | 'Email' | 'Work Report';
export type ToneType = 'Formal' | 'Enthusiastic' | 'Professional' | 'Emotional' | 'Urgent';
export type LanguageType = 'Marathi' | 'English' | 'Hindi';

export const AIService = {
    generateContent: async (
        topic: string,
        type: ContentType,
        tone: ToneType,
        language: LanguageType
    ): Promise<string> => {
        if (!API_KEY) {
            throw new Error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in .env");
        }

        try {
            // Using Gemini 2.5 Flash as requested for real AI generation
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            let prompt = `
        Act as a professional political content writer for a Nagar Sevak (City Council Member).
        
        Write a ${type} about: "${topic}".
        
        Tone: ${tone}
        Language: ${language}
        
        Requirements:
        - Keep it engaging and relevant to local citizens.
        - Maintain cultural context of Maharashtra/India.
      `;

            if (type === 'Work Report') {
                prompt += `
        - Focus on the details of the development work.
        - Mention the impact on the community.
        - Mention that the work is completed/in-progress as per the context.
        - Keep it concise (under 100 words) for a report description.
        `;
            } else if (type === 'Speech') {
                prompt += `
        - Include appropriate salutations.
        `;
            } else if (type === 'Social Media Caption') {
                prompt += `
        - Include relevant hashtags.
        `;
            }

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();

        } catch (error: any) {
            const isMarathi = language === 'Marathi';


            if (type === 'Work Report') {
                if (isMarathi) {
                    return `या कामांतर्गत आम्ही '${topic}' यशस्वीरित्या पूर्ण केले आहे. यामुळे परिसरातील नागरिकांची मोठी सोय झाली असून, प्रभागाच्या विकासात हे एक महत्त्वाचे पाऊल आहे. आम्ही गुणवत्तेशी कोणतीही तडजोड न करता हे काम पूर्ण केले आहे.`;
                }
                return `Under this project, we have successfully completed '${topic}'. This has provided great convenience to the residents and is a significant step in the ward's development. We have ensured high quality in this work.`;
            }

            if (type === 'Speech') {
                if (isMarathi) {
                    return `सन्माननीय नागरिक आणि माझ्या बंधू-भगिनींनो,\n\nआज आपण एका अत्यंत महत्त्वाच्या विषयावर चर्चा करण्यासाठी येथे जमलो आहोत - '${topic}'.\n\nआपल्या प्रभागाचा विकास आणि नागरिकांचे हित हेच माझे प्रथम कर्तव्य आहे. '${topic}' च्या माध्यमातून आपण आपल्या परिसराचा चेहरामोहरा बदलणार आहोत. मी तुम्हाला खात्री देतो की, आपण सर्वांनी मिळून यावर काम केल्यास नक्कीच सकारात्मक बदल घडेल.\n\nतुमच्या सहकार्याबद्दल मी आपला सदैव ऋणी राहीन.\n\nजय हिंद, जय महाराष्ट्र!\n- आपला सेवक.`;
                }
                return `Respected Citizens and Friends,\n\nWe have gathered here today to discuss a very important initiative: '${topic}'.\n\nMy primary duty is the development of our ward and the welfare of every citizen. Through this initiative, we aim to bring significant improvements to our community. I assure you that with your support, we will achieve our goals.\n\nThank you for your trust and cooperation.\n\nJai Hind!\n- Your Sevak`;
            }

            if (type === 'Social Media Caption') {
                if (isMarathi) {
                    return `📢 **महत्त्वाची घोषणा: ${topic}**\n\nआज आपल्या प्रभागात '${topic}' संदर्भात महत्त्वपूर्ण काम हाती घेण्यात आले आहे. नागरिकांच्या सुविधांसाठी आम्ही सदैव कटिबद्ध आहोत. 💪\n\nआपल्या सूचना आणि सहकार्याचे स्वागत आहे!\n\n#Ward5 #Development #Pune #NagarSevak #PrabhagVikas`;
                }
                return `📢 **Update: ${topic}**\n\nWe are excited to announce new progress regarding '${topic}' in our ward today! committed to serving you better every day. 💪\n\nYour feedback helps us grow!\n\n#WardDevelopment #Community #CityCouncil #WorkInProgress`;
            }

            if (type === 'Press Release' || type === 'Letter/Notice') {
                if (isMarathi) {
                    return `**जाहीर नोटीस**\n\nविषय: ${topic} बाबत.\n\nतमाम नागरिकांना सूचित करण्यात येते की, '${topic}' या कामाला वेगाने सुरुवात झाली आहे. या कामामुळे नागरिकांना होणाऱ्या कोणत्याही असुविधेबद्दल आम्ही दिलगीर आहोत, परंतु हे काम भविष्यात आपल्या सर्वांसाठी फायदेशीर ठरणार आहे.\n\nअधिक माहितीसाठी माझ्या जनसंपर्क कार्यालयाशी संपर्क साधावा.\n\nआपला नम्र,\nनगरसेवक (प्रभाग ५)`;
                }
                return `**PUBLIC NOTICE**\n\nSubject: Regarding ${topic}\n\nThis is to inform all citizens that work on '${topic}' has officially commenced. We apologize for any temporary inconvenience this may cause, but assure you that this project will bring long-term benefits to our community.\n\nFor more details, please contact the Ward Office.\n\nSincerely,\nCouncil Member (Ward 5)`;
            }

            // Default email/other
            return isMarathi
                ? `विषय: ${topic}\n\nमहोदय/महोदया,\n\nआपल्या विनंतीनुसार, आम्ही '${topic}' या विषयावर लक्ष केंद्रित केले आहे. लवकरच यावर कार्यवाही होईल. \n\nधन्यवाद.`
                : `Subject: Update on ${topic}\n\nDear Citizen,\n\nWe have noted the concerns regarding '${topic}' and are taking necessary steps. You will see progress shortly.\n\nRegards,`;
        }
    },
};

export const AIAnalysisService = {
    // 1. Smart Complaint Management
    analyzeComplaint: async (
        title: string,
        description: string,
        imageBase64?: string
    ): Promise<{ category: string; urgency: 'Low' | 'Medium' | 'High'; validation: string }> => {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            let prompt = `
            Analyze this citizen complaint for a City Council system.
            Title: "${title}"
            Description: "${description}"
            
            Task:
            1. Categorize it into one of: 'Cleaning', 'Water', 'Road', 'Drainage', 'StreetLight', 'Other'.
            2. Determine Urgency (Low, Medium, High) based on keywords like 'safety', 'danger', 'health', 'broken'.
            3. If an image is provided, verify if it matches the description. If no image, set validation to "No image provided".
            
            Return JSON: { "category": "...", "urgency": "...", "validation": "..." }
            `;

            let imagePart = null;
            if (imageBase64) {
                // Remove header if present (e.g., "data:image/jpeg;base64,")
                const base64Data = imageBase64.split(',')[1] || imageBase64;
                imagePart = {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/jpeg"
                    }
                };
            }

            const result = imagePart
                ? await model.generateContent([prompt, imagePart])
                : await model.generateContent(prompt);

            return JSON.parse(result.response.text());
        } catch (error) {
            console.error("AI Complaint Analysis Failed:", error);
            return { category: 'Other', urgency: 'Medium', validation: 'AI Analysis Failed' };
        }
    },

    // 2. Scheme Recommendations
    matchSchemes: async (
        userProfile: string,
        schemesList: any[]
    ): Promise<number[]> => {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `
            Act as a Welfare Officer.
            User Profile: ${userProfile}
            
            Available Schemes (JSON): ${JSON.stringify(schemesList.map(s => ({ id: s.id, name: s.name, eligibility: s.eligibility })))}
            
            Task: Return a JSON object containing an array of 'matchedIds' for schemes that this user is eligible for.
            Strictly check Age, Income, Gender, and Occupation criteria.
            
            Return JSON: { "matchedIds": [1, 2, ...] }
            `;

            const result = await model.generateContent(prompt);
            const response = JSON.parse(result.response.text());
            return response.matchedIds || [];
        } catch (error) {
            console.error("AI Scheme Matching Failed:", error);
            return [];
        }
    },

    // 3. Document Scanner (OCR -> Task)
    parseDocument: async (imageBase64: string): Promise<{ title: string; description: string; deadline: string; priority: string }> => {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const base64Data = imageBase64.split(',')[1] || imageBase64;
            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg"
                }
            };

            const prompt = `
            Extract task details from this official document/letter.
            Identify:
            1. Title (Short summary)
            2. Description (Key actionable items)
            3. Deadline (YYYY-MM-DD) - if explicitly mentioned, otherwise guess based on urgency or return null.
            4. Priority (High/Medium/Low)
            
            Return JSON: { "title": "...", "description": "...", "deadline": "...", "priority": "..." }
            `;

            const result = await model.generateContent([prompt, imagePart]);
            return JSON.parse(result.response.text());
        } catch (error) {
            console.error("AI Document Parsing Failed:", error);
            return {
                title: "Manual Review Required",
                description: "AI could not parse the document. Please enter details manually.",
                deadline: "",
                priority: "Medium"
            };
        }
    },

    // 4. Dashboard Daily Briefing
    generateDailyBriefing: async (stats: any, recentComplaints: any[]): Promise<string> => {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `
            Act as a confident Political Analyst for a City Councilor.
            Based on this daily data, write a 2-sentence "Morning Briefing" summary.
            
            Stats: 
            - Pending Complaints: ${stats.pending}
            - Resolved Today: ${stats.resolved}
            - Total Voters: ${stats.voters}
            
            Recent Issues: ${recentComplaints.map(c => c.title).join(', ')}
            
            Goal: Highlight the most critical area to focus on today. Be inspiring but practical.
            `;

            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            return "Focus on clearing pending complaints and engaging with citizens today.";
        }
    }
};
