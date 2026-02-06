import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PenTool, Copy, RefreshCw, Wand2, Check, History, Clock, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AIService, type ContentType, type ToneType, type LanguageType } from '../../services/aiService';
import { AIHistoryService } from '../../services/aiHistoryService';
import { type AIHistoryItem } from '../../types';

const ContentStudio = () => {
    const { t } = useLanguage();
    const [topic, setTopic] = useState('');
    const [contentType, setContentType] = useState<ContentType>('Speech');
    const [tone, setTone] = useState<ToneType>('Enthusiastic');
    const [language, setLanguage] = useState<LanguageType>('Marathi');

    const [generatedContent, setGeneratedContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const [history, setHistory] = useState<AIHistoryItem[]>([]);
    const [historySearch, setHistorySearch] = useState('');

    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setHistoryLoading(true);
        // Simulate network delay
        setTimeout(async () => {
            const items = await AIHistoryService.getHistory();
            setHistory(items);
            setHistoryLoading(false);
        }, 800);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setLoading(true);
        try {
            const content = await AIService.generateContent(topic, contentType, tone, language);
            setGeneratedContent(content);
            setCopied(false);

            // Save to history
            await AIHistoryService.addToHistory({
                title: topic,
                contentType: contentType,
                tone: tone,
                language: language,
                generatedContent: content,
                messages: [] // Placeholder for future chat context
            });

            // Reload history to show new item
            loadHistory();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadFromHistory = (item: AIHistoryItem) => {
        setTopic(item.title);
        setContentType(item.contentType as ContentType);
        setTone((item.tone as ToneType) || 'Formal');
        setLanguage((item.language as LanguageType) || 'English');
        setGeneratedContent(item.generatedContent);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl">
                            <Wand2 className="w-7 h-7 text-brand-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{t('content_studio.title')}</h1>
                            <p className="text-slate-600">{t('content_studio.subtitle')}</p>
                        </div>
                    </div>

                    {/* Mobile History Toggle (Visible on small screens if we implement response design later, currently desktop focused) */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                    {/* Input Section */}
                    <div className="ns-card p-6 h-fit">
                        <h2 className="text-lg font-semibold mb-4 flex items-center">
                            <PenTool className="w-5 h-5 mr-2 text-slate-500" />
                            {t('content_studio.title')}
                        </h2>

                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('content_studio.topic_label')}</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="ns-input"
                                    placeholder={t('content_studio.topic_placeholder')}
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('content_studio.type_label')}</label>
                                    <select
                                        className="ns-input"
                                        value={contentType}
                                        onChange={(e) => setContentType(e.target.value as ContentType)}
                                    >
                                        <option value="Speech">{t('content_studio.types.Speech')}</option>
                                        <option value="Social Media Caption">{t('content_studio.types.Social Media Caption')}</option>
                                        <option value="Press Release">{t('content_studio.types.Press Release')}</option>
                                        <option value="Letter/Notice">{t('content_studio.types.Letter/Notice')}</option>
                                        <option value="Email">{t('content_studio.types.Email')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('content_studio.tone_label')}</label>
                                    <select
                                        className="ns-input"
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value as ToneType)}
                                    >
                                        <option value="Enthusiastic">{t('content_studio.tones.Enthusiastic')}</option>
                                        <option value="Formal">{t('content_studio.tones.Formal')}</option>
                                        <option value="Professional">{t('content_studio.tones.Professional')}</option>
                                        <option value="Emotional">{t('content_studio.tones.Emotional')}</option>
                                        <option value="Urgent">{t('content_studio.tones.Urgent')}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('content_studio.language_label')}</label>
                                <select
                                    className="ns-input"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as LanguageType)}
                                >
                                    <option value="Marathi">मराठी (Marathi)</option>
                                    <option value="English">English</option>
                                    <option value="Hindi">हिंदी (Hindi)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !topic}
                                className="ns-btn-primary w-full justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>{t('content_studio.generating_btn')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        <span>{t('content_studio.generate_btn')}</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Output Section */}
                    <div className="ns-card p-6 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">{t('content_studio.result_title')}</h2>
                            {generatedContent && (
                                <button
                                    onClick={handleCopy}
                                    className={copied ? 'ns-btn-soft' : 'ns-btn-ghost border border-slate-200'}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    <span>{copied ? t('content_studio.copied_btn') : t('content_studio.copy_btn')}</span>
                                </button>
                            )}
                        </div>

                        <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-200/70 overflow-y-auto max-h-[500px]">
                            {loading && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                                    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
                                    <p>Generating…</p>
                                </div>
                            )}

                            {!loading && !generatedContent && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <Wand2 className="w-12 h-12 mb-2" />
                                    <p>{t('content_studio.empty_state_title')}</p>
                                </div>
                            )}

                            {!loading && generatedContent && (
                                <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">
                                    {generatedContent}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* History Sidebar - Desktop */}
            <div className="w-80 ns-card overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-slate-200/70 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-700 flex items-center">
                            <History className="w-4 h-4 mr-2" />
                            {t('content_studio.history_title')}
                        </h3>
                        <span className="text-xs text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-full">{history.length}</span>
                    </div>

                    {/* History Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('content_studio.history_search_placeholder')}
                            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {historyLoading ? (
                        <>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
                                        <div className="h-3 w-12 bg-slate-200 rounded animate-pulse" />
                                    </div>
                                    <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse mb-2" />
                                    <div className="space-y-1">
                                        <div className="h-3 w-full bg-slate-200 rounded animate-pulse" />
                                        <div className="h-3 w-5/6 bg-slate-200 rounded animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        history.filter(item =>
                            item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
                            item.generatedContent.toLowerCase().includes(historySearch.toLowerCase())
                        ).length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                {historySearch ? (
                                    <>
                                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">{t('content_studio.no_matches')}</p>
                                    </>
                                ) : (
                                    <>
                                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">{t('content_studio.no_history')}</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            history
                                .filter(item =>
                                    item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
                                    item.generatedContent.toLowerCase().includes(historySearch.toLowerCase())
                                )
                                .map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleLoadFromHistory(item)}
                                        className="p-3 rounded-xl border border-slate-200/70 hover:border-brand-200 hover:bg-brand-50/40 cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded">
                                                {item.contentType}
                                            </span>
                                            <span className="text-[10px] text-slate-500 flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-medium text-slate-800 line-clamp-2 mb-1 group-hover:text-brand-800">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {item.generatedContent}
                                        </p>
                                    </div>
                                ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentStudio;

