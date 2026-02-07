
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language } from '../utils/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Get initial language from localStorage or default to 'en'
    const getInitialLanguage = (): Language => {
        const saved = localStorage.getItem('ns_language') as Language;
        // Only support 'en' and 'mr' now
        if (saved && (saved === 'en' || saved === 'mr')) return saved;
        return 'en';
    };

    const [language, setLanguageState] = useState<Language>(getInitialLanguage);

    useEffect(() => {
        const initialLang = getInitialLanguage();
        if (initialLang !== language) {
            setLanguageState(initialLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        // Only support English and Marathi
        if (lang !== 'en' && lang !== 'mr') {
            console.warn(`Language ${lang} not supported. Only 'en' and 'mr' are available.`);
            return;
        }

        setLanguageState(lang);
        localStorage.setItem('ns_language', lang);
    };

    // Translation function: supports nested keys like 'common.welcome' and interpolation {{key}}
    const t = (key: string, params?: Record<string, string | number>): string => {
        const keys = key.split('.');
        let current: any = translations[language];
        let result = key;

        let found = true;

        // Try finding in current language
        for (const k of keys) {
            if (current && current[k]) {
                current = current[k];
            } else {
                found = false;
                break;
            }
        }

        // If not found or not a string, try fallback
        if (!found || typeof current !== 'string') {
            let fallback: any = translations['en'];
            let fallbackFound = true;
            for (const k of keys) {
                if (fallback && fallback[k]) {
                    fallback = fallback[k];
                } else {
                    fallbackFound = false;
                    break;
                }
            }
            if (fallbackFound && typeof fallback === 'string') {
                result = fallback;
            } else {
                return key; // Return key if absolutely not found
            }
        } else {
            result = current as string;
        }

        // Interpolation
        if (params) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
            });
        }

        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
