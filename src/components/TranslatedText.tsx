import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translateText, transliterateName } from '../services/translationService';

interface TranslatedTextProps {
    text: string;
    className?: string;
    isName?: boolean;
}

export const TranslatedText = ({ text, className, isName = false }: TranslatedTextProps) => {
    const { language } = useLanguage();
    const [displayText, setDisplayText] = useState(text);

    useEffect(() => {
        let isMounted = true;

        const doTranslate = async () => {
            if (language === 'en') {
                setDisplayText(text);
                return;
            }

            try {
                // If text is short/empty, ignore
                if (!text?.trim()) return;

                const convertedText = isName 
                    ? await transliterateName(text, language)
                    : await translateText(text, language);
                if (isMounted) setDisplayText(convertedText);
            } catch (e) {
                console.warn('Translation failed for component', e);
            }
        };

        doTranslate();

        return () => { isMounted = false; };
    }, [text, language]);

    return <span className={className}>{displayText}</span>;
};
