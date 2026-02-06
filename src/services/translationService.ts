/**
 * Service for translating text using standard APIs (non-LLM).
 * Default provider: Google Translate (gtx) - Robust free usage
 */

const API_URL = "https://translate.googleapis.com/translate_a/single";

const translationCache = new Map<string, string>();

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
    "Nagar": "नगर"
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
        translationCache.set(cacheKey, result);
        return result;
    }

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
            // Use CORS Proxy in Development
            const params = new URLSearchParams({
                client: "gtx",
                sl: sourceLang,
                tl: targetLang,
                dt: "t",
                q: textToTranslate
            });

            const googleUrl = `${API_URL}?${params.toString()}`;
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(googleUrl)}`;
            response = await fetch(proxyUrl);
        }

        if (!response.ok) {
            console.warn(`Translation API error: ${response.statusText}`);
            return text;
        }

        const data = await response.json();

        if (data && data[0]) {
            let translatedText = data[0]
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

                translationCache.set(cacheKey, translatedText);
                return translatedText;
            }
        }

        return text;

    } catch (error) {
        console.error("Translation service failed:", error);
        return text;
    }
};
