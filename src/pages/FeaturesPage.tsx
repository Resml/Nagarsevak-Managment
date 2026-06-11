import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, MessageSquare, Users, Building2, BarChart2, LayoutDashboard, Shield, Eye } from 'lucide-react';
import { SEO } from '../components/SEO';

const FeaturesPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, language, setLanguage } = useLanguage();

    const title = language === 'mr' ? 'वैशिष्ट्ये - कृष्णनीती नगरसेवक व्यवस्थापन प्रणाली' : 'Features - Krishnaniti Nagarsevak Management';
    const description = language === 'mr' 
        ? 'कृष्णनीतीची मुख्य वैशिष्ट्ये शोधा: तक्रार निवारण, मतदार संपर्क, आणि विकास कार्य मागोवा.' 
        : 'Explore the key features of Krishnaniti: Grievance management, citizen connection, and development work tracking.';

    const featuresSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title,
        "description": description,
        "url": "https://krishnaniti.in/features"
    };

    return (
        <main className="min-h-screen bg-white font-sans text-slate-900">
            <SEO 
                title={title}
                description={description}
                url={language === 'mr' ? 'https://krishnaniti.in/features?lang=mr' : 'https://krishnaniti.in/features'}
                structuredData={featuresSchema}
            />
            {language === 'mr' ? (
                <Helmet>
                    <link rel="alternate" hrefLang="en" href="https://krishnaniti.in/features" />
                </Helmet>
            ) : (
                <Helmet>
                    <link rel="alternate" hrefLang="mr" href="https://krishnaniti.in/features?lang=mr" />
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
                            <a href={language === 'mr' ? '/faq?lang=mr' : '/faq'} className="font-medium text-sm text-slate-600 hover:text-brand-600 transition">
                                {language === 'mr' ? 'प्रश्न' : 'FAQ'}
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

            {/* Hero Section */}
            <section className="relative pt-32 pb-16 bg-slate-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 leading-tight mb-6"
                    >
                        {language === 'mr' ? 'प्लॅटफॉर्म वैशिष्ट्ये' : 'Platform Features'}
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="max-w-2xl mx-auto text-lg text-slate-600 mb-8"
                    >
                        {language === 'mr' 
                            ? 'स्थानिक नेतृत्वाला सक्षम करण्यासाठी आणि लोकांच्या सोयीसाठी डिझाइन केलेली सर्व साधने एकाच ठिकाणी.'
                            : 'All the tools designed to empower local leadership and serve citizens efficiently, in one integrated workspace.'}
                    </motion.p>
                </div>
            </section>

            {/* Features Detail Grid */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={MessageSquare}
                            title={t('landing.features.complaints_title')}
                            description={t('landing.features.complaints_desc')}
                            color="blue"
                        />
                        <FeatureCard
                            icon={Users}
                            title={t('landing.features.voters_title')}
                            description={t('landing.features.voters_desc')}
                            color="indigo"
                        />
                        <FeatureCard
                            icon={Building2}
                            title={t('landing.features.works_title')}
                            description={t('landing.features.works_desc')}
                            color="cyan"
                        />
                        <FeatureCard
                            icon={BarChart2}
                            title={t('landing.features.analysis_title')}
                            description={t('landing.features.analysis_desc')}
                            color="emerald"
                        />
                        <FeatureCard
                            icon={LayoutDashboard}
                            title={t('landing.features.schemes_title')}
                            description={t('landing.features.schemes_desc')}
                            color="violet"
                        />
                        <FeatureCard
                            icon={Shield}
                            title={t('landing.features.comm_title')}
                            description={t('landing.features.comm_desc')}
                            color="rose"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-slate-50 border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
                        {language === 'mr' ? 'तुमचा प्रभाग अधिक कार्यक्षम बनवा' : 'Ready to Transform Your Ward?'}
                    </h2>
                    <button
                        onClick={() => navigate(user ? '/dashboard' : '/login')}
                        className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-brand-600/30 transition-all active:scale-95"
                    >
                        {user ? t('landing.hero.dashboard') : t('landing.hero.get_started')}
                    </button>
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
                            <a href={language === 'mr' ? '/faq?lang=mr' : '/faq'} className="hover:text-white transition">FAQ</a>
                            <a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a>
                        </div>
                        <p>&copy; {new Date().getFullYear()} Krishnaniti. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
};

const FeatureCard = ({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) => {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600",
        indigo: "bg-indigo-50 text-indigo-600",
        cyan: "bg-cyan-50 text-cyan-600",
        emerald: "bg-emerald-50 text-emerald-600",
        violet: "bg-violet-50 text-violet-600",
        rose: "bg-rose-50 text-rose-600",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand-100/50 transition-all group hover:-translate-y-1"
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colorClasses[color] || colorClasses.blue}`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
        </motion.div>
    );
};

export default FeaturesPage;
