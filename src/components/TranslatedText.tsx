import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../services/translationService';

interface TranslatedTextProps {
    text: string;
    className?: string;
}

export const TranslatedText = ({ text, className }: TranslatedTextProps) => {
    const { language } = useLanguage();
    const [displayText, setDisplayText] = useState(text);

    useEffect(() => {
        let isMounted = true;

        const doTranslate = async () => {
            if (language !== 'mr') {
                setDisplayText(text);
                return;
            }

            try {
                // If text is short/empty, ignore
                if (!text?.trim()) return;

                const translated = await translateText(text, 'mr');
                if (isMounted) setDisplayText(translated);
            } catch (e) {
                console.warn('Translation failed for component', e);
            }
        };

        doTranslate();

        return () => { isMounted = false; };
    }, [text, language]);

    return <span className={className}>{displayText}</span>;
};
