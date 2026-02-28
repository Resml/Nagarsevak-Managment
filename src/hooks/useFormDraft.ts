import { useState, useEffect } from 'react';

export function useFormDraft<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, () => void] {
    // Read initial state from localStorage or use provided initialValue
    const [draft, setDraft] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading draft for key "${key}"`, error);
            return initialValue;
        }
    });

    // Save to localStorage whenever draft changes
    useEffect(() => {
        try {
            // Only save if it's different from initial value to avoid saving empty drafts immediately
            // But if it's an object, a simple comparison might not work perfectly, so we just stringify.
            const stringifiedDraft = JSON.stringify(draft);
            const stringifiedInitial = JSON.stringify(initialValue);

            if (stringifiedDraft !== stringifiedInitial) {
                window.localStorage.setItem(key, stringifiedDraft);
            }
        } catch (error) {
            console.error(`Error saving draft for key "${key}"`, error);
        }
    }, [key, draft, initialValue]);

    // Function to clear the draft manually (e.g., after successful submission)
    const clearDraft = () => {
        try {
            window.localStorage.removeItem(key);
            setDraft(initialValue);
        } catch (error) {
            console.error(`Error clearing draft for key "${key}"`, error);
        }
    };

    return [draft, setDraft, clearDraft];
}
