
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language } from '../utils/translations';
import { translateWidget } from '../services/googleTranslateWidget';

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

    // Initialize Google Translate widget on mount
    useEffect(() => {
        translateWidget.initialize();

        // If initial language is Marathi, trigger translation
        const initialLang = getInitialLanguage();
        if (initialLang === 'mr') {
            // Small delay to ensure widget is ready
            setTimeout(() => {
                translateWidget.changeLanguage('mr');
            }, 1000);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        // Only support English and Marathi
        if (lang !== 'en' && lang !== 'mr') {
            console.warn(`Language ${lang} not supported. Only 'en' and 'mr' are available.`);
            return;
        }

        const previousLang = language;

        setLanguageState(lang);
        localStorage.setItem('ns_language', lang);

        // If switching back to English from Marathi, clear Google Translate cookie and reload
        if (lang === 'en' && previousLang === 'mr') {
            // Clear Google Translate cookies
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname.split('.').slice(-2).join('.');

            // Small delay to ensure cookies are cleared
            setTimeout(() => {
                window.location.reload();
            }, 100);
            return;
        }

        // If switching to Marathi, trigger Google Translate
        if (lang === 'mr') {
            translateWidget.changeLanguage('mr');
        }
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
