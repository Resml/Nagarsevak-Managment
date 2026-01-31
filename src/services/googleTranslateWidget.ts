/**
 * Google Translate Widget Service - Marathi Only
 * 
 * This service provides Google Translate integration for Marathi language only.
 * English content uses the native app translations.
 */

declare global {
    interface Window {
        google?: {
            translate: {
                TranslateElement: new (
                    config: {
                        pageLanguage: string;
                        includedLanguages: string;
                        layout?: number;
                        autoDisplay?: boolean;
                    },
                    elementId: string
                ) => void;
            };
        };
        googleTranslateElementInit?: () => void;
    }
}

type SupportedLanguage = 'en' | 'mr';

class GoogleTranslateWidget {
    private static instance: GoogleTranslateWidget;
    private initialized = false;
    private currentLanguage: SupportedLanguage = 'en';

    private constructor() { }

    static getInstance(): GoogleTranslateWidget {
        if (!GoogleTranslateWidget.instance) {
            GoogleTranslateWidget.instance = new GoogleTranslateWidget();
        }
        return GoogleTranslateWidget.instance;
    }

    /**
     * Initialize the Google Translate widget
     */
    initialize(): void {
        if (this.initialized) {
            return;
        }

        // Load Google Translate script if not already loaded
        if (!document.getElementById('google-translate-script')) {
            const script = document.createElement('script');
            script.id = 'google-translate-script';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.head.appendChild(script);
        }

        // Set up initialization callback
        window.googleTranslateElementInit = () => {
            if (window.google?.translate?.TranslateElement) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: 'en',
                        includedLanguages: 'en,mr', // Only English and Marathi
                        layout: 0,
                        autoDisplay: false,
                    },
                    'google_translate_element'
                );
                this.initialized = true;

                // Hide Google UI elements after initialization
                setTimeout(() => this.hideGoogleUI(), 100);
            }
        };

        // Create hidden container for the widget
        if (!document.getElementById('google_translate_element')) {
            const container = document.createElement('div');
            container.id = 'google_translate_element';
            container.style.display = 'none';
            document.body.appendChild(container);
        }

        // Add CSS to hide Google branding
        this.addCustomStyles();

        // Continuously monitor and hide Google UI
        this.setupUIHider();
    }

    /**
     * Change the translation language
     * Only supports 'en' (English - native) and 'mr' (Marathi - translated)
     */
    changeLanguage(targetLang: SupportedLanguage): void {
        if (targetLang === this.currentLanguage) {
            return;
        }

        this.currentLanguage = targetLang;

        if (!this.initialized) {
            console.warn('Google Translate not initialized yet');
            return;
        }

        // Wait for widget to be ready
        const interval = setInterval(() => {
            const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;

            if (selectElement) {
                clearInterval(interval);

                // Map language codes: 'en' = empty string (original), 'mr' = 'mr'
                const langCode = targetLang === 'en' ? '' : 'mr';

                // Change the select value
                selectElement.value = langCode;

                // Trigger change event
                const event = new Event('change', { bubbles: true });
                selectElement.dispatchEvent(event);

                // Hide Google UI after language change
                setTimeout(() => this.hideGoogleUI(), 500);
            }
        }, 100);

        // Clear interval after 5 seconds if widget not found
        setTimeout(() => clearInterval(interval), 5000);
    }

    /**
     * Add custom CSS to completely hide Google Translate UI
     */
    private addCustomStyles(): void {
        if (document.getElementById('google-translate-custom-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'google-translate-custom-styles';
        style.textContent = `
      /* Hide Google Translate toolbar and branding */
      .goog-te-banner-frame {
        display: none !important;
        visibility: hidden !important;
      }
      
      body {
        top: 0 !important;
        position: static !important;
      }
      
      .goog-te-gadget,
      .goog-te-gadget > span,
      .goog-te-gadget > div,
      .goog-te-combo,
      .goog-te-menu-frame,
      .goog-logo-link,
      .goog-te-gadget img,
      iframe.goog-te-banner-frame,
      body > .skiptranslate,
      #goog-gt-tt,
      .goog-te-balloon-frame,
      .skiptranslate iframe,
      #google_translate_element {
        display: none !important;
      }
    `;
        document.head.appendChild(style);
    }

    /**
     * Hide all Google Translate UI elements
     */
    private hideGoogleUI(): void {
        // Hide banner frames
        const frames = document.querySelectorAll<HTMLElement>('.goog-te-banner-frame, iframe.goog-te-banner-frame');
        frames.forEach(frame => {
            frame.style.display = 'none';
            frame.style.visibility = 'hidden';
            if (frame.parentElement) {
                frame.parentElement.style.display = 'none';
            }
        });

        // Reset body positioning
        document.body.style.top = '0';
        document.body.style.position = 'static';

        // Hide top-level skiptranslate divs
        const skipTranslate = document.querySelectorAll<HTMLElement>('body > .skiptranslate');
        skipTranslate.forEach(el => {
            if (!el.querySelector('.goog-te-combo')) {
                el.style.display = 'none';
            }
        });

        // Hide Google iframes
        const allIframes = document.querySelectorAll<HTMLIFrameElement>('iframe');
        allIframes.forEach(iframe => {
            if (iframe.className.includes('goog-te') || iframe.src.includes('translate.google')) {
                iframe.style.display = 'none';
                if (iframe.parentElement) {
                    iframe.parentElement.style.display = 'none';
                }
            }
        });
    }

    /**
     * Set up continuous UI hiding
     */
    private setupUIHider(): void {
        this.hideGoogleUI();

        // Check every 500ms
        setInterval(() => {
            this.hideGoogleUI();
        }, 500);

        // Mutation observer for immediate hiding
        const observer = new MutationObserver(() => {
            this.hideGoogleUI();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: false,
            attributes: true,
            attributeFilter: ['style', 'class'],
        });
    }

    getCurrentLanguage(): SupportedLanguage {
        return this.currentLanguage;
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}

export const translateWidget = GoogleTranslateWidget.getInstance();
export type { SupportedLanguage };
