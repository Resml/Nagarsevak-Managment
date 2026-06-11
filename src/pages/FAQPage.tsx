import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { SEO } from '../components/SEO';

const FAQPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, language, setLanguage } = useLanguage();

    const title = language === 'mr' ? 'नेहमी विचारले जाणारे प्रश्न - कृष्णनीती' : 'FAQ - Krishnaniti';
    const description = language === 'mr' 
        ? 'कृष्णनीतीबद्दल वारंवार विचारले जाणारे प्रश्न आणि उत्तरे मिळवा.' 
        : 'Get answers to frequently asked questions about the Krishnaniti platform.';

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [1, 2, 3, 4].map((i) => ({
            "@type": "Question",
            "name": t(`faq.q${i}`),
            "acceptedAnswer": {
                "@type": "Answer",
                "text": t(`faq.a${i}`)
            }
        }))
    };

    return (
        <main className="min-h-screen bg-white font-sans text-slate-900">
            <SEO 
                title={title}
                description={description}
                url={language === 'mr' ? 'https://krishnaniti.in/faq?lang=mr' : 'https://krishnaniti.in/faq'}
                structuredData={faqSchema}
            />
            {language === 'mr' ? (
                <Helmet>
                    <link rel="alternate" hrefLang="en" href="https://krishnaniti.in/faq" />
                </Helmet>
            ) : (
                <Helmet>
                    <link rel="alternate" hrefLang="mr" href="https://krishnaniti.in/faq?lang=mr" />
                </Helmet>
            )}

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(language === 'mr' ? '/?lang=mr' : '/')}>
                            <img src="/favicon.svg" alt="Krishnaniti Logo" loading="lazy" width="40" height="40" className="h-10 w-10 object-contain" />
                            <span className="font-display font-bold text-2xl tracking-tight text-slate-900">
                                Krishnaniti
                            </span>
                        </div>
                        <div className="flex items-center gap-6">
                            <a href={language === 'mr' ? '/?lang=mr' : '/'} className="font-medium text-sm text-slate-600 hover:text-brand-600 transition">
                                {language === 'mr' ? 'मुख्यपृष्ठ' : 'Home'}
                            </a>
                            <a href={language === 'mr' ? '/features?lang=mr' : '/features'} className="font-medium text-sm text-slate-600 hover:text-brand-600 transition">
                                {language === 'mr' ? 'वैशिष्ट्ये' : 'Features'}
                            </a>
                            <button
                                onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
                                className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all"
                                title={language === 'en' ? 'Switch to Marathi' : 'Switch to English'}
                                aria-label={language === 'en' ? 'Switch to Marathi language' : 'Switch to English language'}
                            >
                                <Globe className="w-5 h-5" />
                                <span className="sr-only">Switch Language</span>
                            </button>
                            <button
                                onClick={() => navigate(user ? '/dashboard' : '/login')}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full font-medium text-sm transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center gap-2"
                                aria-label={user ? t('landing.hero.dashboard') : t('landing.hero.login')}
                            >
                                <span>{user ? t('landing.hero.dashboard') : t('landing.hero.login')}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* FAQ Main Accordion Section */}
            <section className="py-32 bg-slate-50 min-h-[70vh]">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{t('faq.title')}</h1>
                        <p className="text-slate-600 text-lg">{t('faq.subtitle')}</p>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <FAQItem
                                key={i}
                                question={t(`faq.q${i}`)}
                                answer={t(`faq.a${i}`)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center text-sm">
                        <div className="flex items-center gap-3 mb-4 md:mb-0 text-white">
                            <img src="/favicon.svg" alt="Krishnaniti Logo" loading="lazy" width="32" height="32" className="h-8 w-8 object-contain" />
                            <span className="font-display font-bold text-xl tracking-tight">
                                Krishnaniti
                            </span>
                        </div>
                        <div className="flex gap-6 mb-4 md:mb-0">
                            <a href={language === 'mr' ? '/?lang=mr' : '/'} className="hover:text-white transition">Home</a>
                            <a href={language === 'mr' ? '/features?lang=mr' : '/features'} className="hover:text-white transition">Features</a>
                            <a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a>
                        </div>
                        <p>&copy; {new Date().getFullYear()} Krishnaniti. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors animate-all"
            >
                <span className="font-semibold text-slate-900 pr-8">{question}</span>
                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50/50"
                    >
                        <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100/50 mt-2">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FAQPage;
