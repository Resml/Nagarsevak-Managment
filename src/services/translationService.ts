/**
 * Service for translating text using standard APIs (non-LLM).
 * Default provider: Google Translate (gtx) - Robust free usage
 */

const API_URL = "https://translate.googleapis.com/translate_a/single";

const translationCache = new Map<string, string>();
const MAX_CACHE_SIZE = 500;

const addToCache = (key: string, value: string) => {
    if (translationCache.size >= MAX_CACHE_SIZE) {
        // Remove the oldest entry (Map iterates in insertion order)
        const firstKey = translationCache.keys().next().value;
        if (firstKey) translationCache.delete(firstKey);
    }
    translationCache.set(key, value);
};

/**
 * Custom overrides for specific terms that APIs often mistranslate.
 * This ensures consistent terminology for Areas, Wards, etc.
 */
export const CUSTOM_TRANSLATIONS: Record<string, string> = {
    "Dhankawadi": "धनकवडी",
    "Dhankwadi": "धनकवडी", // Handle typo
    "Bibwewadi": "बिबवेवाडी",
    "Katraj": "कात्रज",
    "Sahakar Nagar": "सहकार नगर",
    "Padmavati": "पद्मावती",
    "Balaji Nagar": "बालाजी नगर",
    "Parvati": "पार्वती",
    "Pune": "पुणे",
    "Maharashtra": "महाराष्ट्र",
    "Lokmanya Nagar": "लोकमान्य नगर",
    "Lokamanya Nagar": "लोकमान्य नगर",
    "Lokmanya": "लोकमान्य",
    "Nagar": "नगर",

    // Work Titles
    "Community Engagement & Welfare Scheme Awareness": "सामुदायिक सहभाग आणि कल्याणकारी योजना जनजागृती",
    "Monitoring Cleanliness & Sanitation Drive": "स्वच्छता मोहीम आणि देखरेख",
    "Coordination with Municipal Officials": "पालिका अधिकाऱ्यांशी समन्वय",

    // Work Descriptions
    "Met local residents and society members to spread awareness about government welfare schemes (health, education, pension). Assisted eligible citizens in understanding the application process.": "स्थानिक रहिवासी आणि संस्था सदस्यांच्या भेटी घेऊन शासकीय कल्याणकारी योजनांची (आरोग्य, शिक्षण, निवृत्तीवेतन) माहिती दिली. पात्र नागरिकांना अर्ज प्रक्रियेत मदत केली.",
    "Supervised cleanliness drive in market area and residential zones. Ensured proper garbage collection and instructed staff regarding regular maintenance schedules.": "बाजार पेठ आणि निवासी क्षेत्रातील स्वच्छता मोहिमेचे निरीक्षण केले. कचरा वेळेवर उचलला जाईल याची खात्री केली आणि कर्मचाऱ्यांना नियमित स्वच्छतेच्या सूचना दिल्या.",
    "Held a meeting with municipal engineers and sanitation supervisors to review pending work and discuss progress on infrastructure projects within the ward.": "प्रलंबित कामांचा आढावा घेण्यासाठी आणि प्रभागातील पायाभूत सुविधांच्या कामांवर चर्चा करण्यासाठी पालिका अभियंते आणि स्वच्छता निरीक्षकांसोबत बैठक घेतली."
};

/**
 * Translates text between languages.
 * @param text - The text to translate
 * @param targetLang - Target language code (e.g., 'mr', 'hi', 'en')
 * @param sourceLang - Source language code (default 'auto')
 */
export const translateText = async (
    text: string,
    targetLang: string,
    sourceLang: string = "auto"
): Promise<string> => {
    if (!text || !text.trim()) return text;

    // Use 'auto' for Google Translate if source not specified
    if (sourceLang === 'autodetect') sourceLang = 'auto';

    const cacheKey = `${text}_${sourceLang}_${targetLang}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)!;
    }

    // Identify terms to protect
    let textToTranslate = text;
    const protections: Array<{ placeholder: string; original: string; replacement: string }> = [];

    if (targetLang === 'mr') {
        // Sort keys by length descending to match longest terms first (e.g. "Lokmanya Nagar" before "Nagar")
        const sortedKeys = Object.keys(CUSTOM_TRANSLATIONS).sort((a, b) => b.length - a.length);

        sortedKeys.forEach((key, index) => {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            if (regex.test(textToTranslate)) {
                const placeholder = `[[_${index}_]]`;
                protections.push({
                    placeholder,
                    original: key,
                    replacement: CUSTOM_TRANSLATIONS[key]
                });
                textToTranslate = textToTranslate.replace(regex, placeholder);
            }
        });
    }

    // Special Case: If the entire text was protected and replaced, return the replacement directly
    if (protections.length === 1 && textToTranslate.trim() === protections[0].placeholder) {
        const result = protections[0].replacement;
        addToCache(cacheKey, result);
        return result;
    }

    // --- NEW: Chunking Logic for Long Text ---
    // Google Translate / Proxies often fail with 414 URI Too Long for texts > ~800 chars
    if (textToTranslate.length > 500) {
        // Split by double newline (paragraphs) or single newline
        const delimiter = textToTranslate.includes('\n\n') ? '\n\n' : '\n';
        const rawChunks = textToTranslate.split(delimiter);

        if (rawChunks.length > 1) {
            let currentChunk = '';
            const optimizedChunks: string[] = [];

            for (const piece of rawChunks) {
                if (currentChunk.length + piece.length > 500) {
                    if (currentChunk) optimizedChunks.push(currentChunk);
                    currentChunk = piece;
                } else {
                    currentChunk = currentChunk ? currentChunk + delimiter + piece : piece;
                }
            }
            if (currentChunk) optimizedChunks.push(currentChunk);

            try {
                // Translate chunks in parallel for maximum speed
                const chunkPromises = optimizedChunks.map(chunk => {
                    if (chunk.trim() === '') return Promise.resolve(chunk);
                    return translateText(chunk, targetLang, sourceLang);
                });

                const translatedChunks = await Promise.all(chunkPromises);

                let finalTranslated = translatedChunks.join(delimiter);

                // Restore protected terms for the combined result
                protections.forEach(({ placeholder, replacement }) => {
                    const restoreRegex = new RegExp(`\\[\\s*\\[\\s*_${protections.indexOf(protections.find(p => p.placeholder === placeholder)!)}_\\s*\\]\\s*\\]`, 'g');
                    finalTranslated = finalTranslated.replace(restoreRegex, replacement);
                    finalTranslated = finalTranslated.replace(placeholder, replacement);
                });

                addToCache(cacheKey, finalTranslated);
                return finalTranslated;

            } catch (e) {
                console.error("Chunk translation failed", e);
                return text;
            }
        }
    }
    // --- END NEW Logic ---

    try {
        let response;
        const isProduction = import.meta.env.PROD;

        if (isProduction) {
            // Use Vercel Serverless Function in Production
            const params = new URLSearchParams({
                sl: sourceLang,
                tl: targetLang,
                q: textToTranslate
            });
            response = await fetch(`/api/translate?${params.toString()}`);
        } else {
            // Direct call to Google Translate API (It natively supports CORS for GET requests)
            const params = new URLSearchParams({
                client: "gtx",
                sl: sourceLang,
                tl: targetLang,
                dt: "t",
                q: textToTranslate
            });

            const googleUrl = `${API_URL}?${params.toString()}`;
            response = await fetch(googleUrl);
        }

        if (!response.ok) {
            console.warn(`Translation API error: ${response.statusText}`);
            return text;
        }

        const parsedData = await response.json();

        if (parsedData && parsedData[0]) {
            let translatedText = parsedData[0]
                .map((segment: any) => segment[0])
                .join("");

            if (translatedText) {
                // Restore protected terms
                protections.forEach(({ placeholder, replacement }) => {
                    // Google Translate sometimes adds spaces around brackets or changes case, 
                    // though [[_n_]] is usually safe. Using a more flexible regex for restoration.
                    const restoreRegex = new RegExp(`\\[\\s*\\[\\s*_${protections.indexOf(protections.find(p => p.placeholder === placeholder)!)}_\\s*\\]\\s*\\]`, 'g');
                    translatedText = translatedText.replace(restoreRegex, replacement);

                    // Direct replace fallback for standard format
                    translatedText = translatedText.replace(placeholder, replacement);
                });

                addToCache(cacheKey, translatedText);
                return translatedText;
            }
        }

        return text;

    } catch (error) {
        console.error("Translation service failed:", error);
        return text;
    }
};
