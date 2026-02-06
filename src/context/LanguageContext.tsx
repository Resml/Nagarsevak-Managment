
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language } from '../utils/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
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

    // Translation function: supports nested keys like 'common.welcome'
    const t = (key: string): string => {
        const keys = key.split('.');
        let current: any = translations[language];

        for (const k of keys) {
            if (current && current[k]) {
                current = current[k];
            } else {
                // Fallback to English if missing
                let fallback: any = translations['en'];
                for (const fk of keys) {
                    if (fallback && fallback[fk]) {
                        fallback = fallback[fk];
                    } else {
                        return key; // Return key if not found
                    }
                }
                return fallback || key;
            }
        }
        return current as string;
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
