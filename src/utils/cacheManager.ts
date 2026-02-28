export const CACHE_VERSION = '1.0.0';
export const CACHE_TIMESTAMP_KEY = 'app_cache_timestamp';
export const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// List of exact keys or prefixes to preserve (e.g., auth tokens, user preferences)
const PRESERVED_KEYS = [
    'sb-', // Supabase tokens (usually sb-<project-ref>-auth-token)
    'supabase.auth.token',
    'i18nextLng', // Language preference
    'theme', // UI theme
    'draft_', // Form Auto-Saves
];

export const cacheManager = {
    init: () => {
        try {
            const now = Date.now();
            const storedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

            // Check if cache needs clearing (expired or first load)
            if (!storedTimestamp || (now - parseInt(storedTimestamp, 10)) > CACHE_EXPIRY_MS) {
                console.log('CacheManager: Clearing stale localStorage entries...');

                const keysToRemove: string[] = [];

                // Identify keys to remove
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                        const isPreserved = PRESERVED_KEYS.some(preserved =>
                            key === preserved || key.startsWith(preserved)
                        );

                        if (!isPreserved) {
                            keysToRemove.push(key);
                        }
                    }
                }

                // Remove identified keys
                keysToRemove.forEach(key => localStorage.removeItem(key));

                // Update timestamp
                localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
                console.log(`CacheManager: Cleared ${keysToRemove.length} stale entries.`);
            } else {
                console.log('CacheManager: Cache is still fresh.');
            }
        } catch (e) {
            console.error('CacheManager Error:', e);
        }
    },

    // Manual force clear
    clearAll: () => {
        try {
            const currentAuthKeys: { key: string, val: string }[] = [];
            // Backup preserved
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && PRESERVED_KEYS.some(p => key.startsWith(p))) {
                    currentAuthKeys.push({ key, val: localStorage.getItem(key) || '' });
                }
            }

            localStorage.clear();

            // Restore preserved
            currentAuthKeys.forEach(({ key, val }) => localStorage.setItem(key, val));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

            // Refresh page to reset states
            window.location.reload();
        } catch (e) {
            console.error('CacheManager Clear Error:', e);
        }
    }
};
