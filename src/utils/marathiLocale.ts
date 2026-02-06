import { enUS } from 'date-fns/locale';

const monthValues = {
    narrow: ['जा', 'फे', 'मा', 'ए', 'मे', 'जू', 'जु', 'ऑ', 'स', 'ऑ', 'नो', 'डि'],
    abbreviated: ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'],
    wide: ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर']
};

export const mr = {
    ...enUS,
    code: 'mr',
    localize: {
        ...enUS.localize,
        month: (index: number, options?: any) => {
            const width = options?.width || 'wide';
            // Map 'short' to 'abbreviated' if needed, or just handle key existence
            if (width === 'short') return monthValues['abbreviated'][index];
            return monthValues[width as keyof typeof monthValues]?.[index] || monthValues['wide'][index];
        }
    }
};
