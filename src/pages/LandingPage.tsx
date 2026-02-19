import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, CheckCircle, Users, BarChart2, MessageSquare, Building2, Eye, LayoutDashboard, Globe, Star, ChevronDown, ChevronUp, Quote } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const { t, language, setLanguage } = useLanguage();

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                                <Shield className="w-5 h-5" />
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight text-slate-900">
                                Nagar Sevak
                            </span>
                        </div>
                        <button
                            onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
                            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all mr-2"
                            title={language === 'en' ? 'Switch to Marathi' : 'Switch to English'}
                        >
                            <Globe className="w-5 h-5" />
                            <span className="sr-only">Switch Language</span>
                        </button>
                        <button
                            onClick={() => navigate(user ? '/dashboard' : '/login')}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full font-medium text-sm transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center gap-2"
                        >
                            <span>{user ? t('landing.hero.dashboard') : t('landing.hero.login')}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-bl from-brand-50 to-white clip-path-slant" />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute top-0 left-0 -z-10 w-full h-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-brand-100/40 via-transparent to-transparent"
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold uppercase tracking-wide mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                        {t('landing.hero.badge')}
                    </motion.div>
                    <motion.h1
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-display font-extrabold text-slate-900 leading-tight mb-8"
                    >
                        {language === 'mr' ? (
                            <>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">स्थानिक नेतृत्वाला</span> सक्षम करणे <br />
                                उज्ज्वल भविष्यासाठी.
                            </>
                        ) : (
                            <>
                                Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">Local Leaders</span> <br />
                                Serving Citizens better.
                            </>
                        )}
                    </motion.h1>
                    <motion.p
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed"
                    >
                        {t('landing.hero.subtitle')}
                    </motion.p>
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button
                            onClick={() => navigate(user ? '/dashboard' : '/login')}
                            className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-brand-600/30 transition-all hover:-translate-y-1"
                        >
                            {user ? t('landing.hero.dashboard') : t('landing.hero.get_started')}
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 hover:border-brand-200 hover:text-brand-700">
                            <Eye className="w-5 h-5" />
                            {t('landing.hero.view_demo')}
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="mt-16 flex items-center justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
                    >
                        {/* Placeholder for trusted logos or minimal text */}
                        <p className="text-sm font-medium text-slate-400">{t('landing.hero.trusted_by')}</p>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('landing.features.title')}</h2>
                        <p className="text-slate-600 text-lg">{t('landing.features.subtitle')}</p>
                    </div>

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

            {/* Testimonials */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-brand-50/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('testimonials.title')}</h2>
                        <p className="text-slate-600 text-lg">{t('testimonials.subtitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <TestimonialCard
                                key={i}
                                quote={t(`testimonials.review_${i}`)}
                                author={t(`testimonials.review_${i}_author`)}
                                role={t(`testimonials.review_${i}_role`)}
                                delay={i * 0.1}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats / Social Proof */}
            <section className="py-24 bg-brand-900 text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10"
                    >
                        <Stat number="50+" label={t('landing.stats.wards')} />
                        <Stat number="10k+" label={t('landing.stats.complaints')} />
                        <Stat number="5L+" label={t('landing.stats.citizens')} />
                        <Stat number="100+" label={t('landing.stats.projects')} />
                    </motion.div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('faq.title')}</h2>
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
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4 text-white">
                                <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span className="font-display font-bold text-xl tracking-tight">
                                    Nagar Sevak
                                </span>
                            </div>
                            <p className="mb-4 max-w-xs">{t('landing.footer.description')}</p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">{t('landing.footer.platform')}</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-brand-400 transition">{t('landing.footer.features')}</a></li>
                                <li><a href="#" className="hover:text-brand-400 transition">{t('landing.footer.testimonials')}</a></li>
                                <li><a href="#" className="hover:text-brand-400 transition">{t('landing.footer.pricing')}</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">{t('landing.footer.legal')}</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-brand-400 transition">{t('landing.footer.privacy')}</a></li>
                                <li><a href="#" className="hover:text-brand-400 transition">{t('landing.footer.terms')}</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
                        <p>&copy; {new Date().getFullYear()} Nagar Sevak Managment System. {t('landing.footer.rights')}</p>
                        <p>{t('landing.footer.made_with_love')}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Helper Components
const FeatureCard = ({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) => {
    // Map simplified color names to tailwind classes if needed, or use dynamic template literals carefully.
    // SAFE: bg-blue-50 text-blue-600, etc.
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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand-100/50 transition-all group hover:-translate-y-1"
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colorClasses[color] || colorClasses.blue}`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed">{description}</p>
        </motion.div>
    )
}

const Stat = ({ number, label }: { number: string, label: string }) => (
    <div className="p-4">
        <div className="text-4xl font-bold text-white mb-1">{number}</div>
        <div className="text-brand-200 font-medium">{label}</div>
    </div>
)

const TestimonialCard = ({ quote, author, role, delay }: { quote: string, author: string, role: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="bg-slate-50 p-8 rounded-2xl relative"
    >
        <Quote className="w-8 h-8 text-brand-200 absolute top-6 left-6 -z-0" />
        <div className="relative z-10">
            <div className="flex text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                ))}
            </div>
            <p className="text-slate-700 mb-6 italic leading-relaxed">"{quote}"</p>
            <div>
                <h4 className="font-bold text-slate-900">{author}</h4>
                <p className="text-sm text-slate-500">{role}</p>
            </div>
        </div>
    </motion.div>
)

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
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
    )
}

export default LandingPage;
