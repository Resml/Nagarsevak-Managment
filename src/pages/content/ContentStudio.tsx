import React, { useState, useEffect } from 'react';
import { PenTool, Copy, RefreshCw, Wand2, Check, History, Clock } from 'lucide-react';
import { AIService, type ContentType, type ToneType, type LanguageType } from '../../services/aiService';
import { AIHistoryService } from '../../services/aiHistoryService';
import { type AIHistoryItem } from '../../types';

const ContentStudio = () => {
    const [topic, setTopic] = useState('');
    const [contentType, setContentType] = useState<ContentType>('Speech');
    const [tone, setTone] = useState<ToneType>('Enthusiastic');
    const [language, setLanguage] = useState<LanguageType>('Marathi');

    const [generatedContent, setGeneratedContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const [history, setHistory] = useState<AIHistoryItem[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const items = await AIHistoryService.getHistory();
        setHistory(items);
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
            alert(error.message);
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
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <Wand2 className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">AI Content Studio</h1>
                            <p className="text-gray-600">Generate speeches, captions, and notices instantly</p>
                        </div>
                    </div>

                    {/* Mobile History Toggle (Visible on small screens if we implement response design later, currently desktop focused) */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                    {/* Input Section */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h2 className="text-lg font-semibold mb-4 flex items-center">
                            <PenTool className="w-5 h-5 mr-2 text-gray-500" />
                            Content Details
                        </h2>

                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Context</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. Inauguration of new community hall in Ward 5 on Sunday..."
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                        value={contentType}
                                        onChange={(e) => setContentType(e.target.value as ContentType)}
                                    >
                                        <option value="Speech">Speech</option>
                                        <option value="Social Media Caption">Social Media Caption</option>
                                        <option value="Press Release">Press Release</option>
                                        <option value="Letter/Notice">Letter / Notice</option>
                                        <option value="Email">Email</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value as ToneType)}
                                    >
                                        <option value="Enthusiastic">Enthusiastic</option>
                                        <option value="Formal">Formal</option>
                                        <option value="Professional">Professional</option>
                                        <option value="Emotional">Emotional</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as LanguageType)}
                                >
                                    <option value="Marathi">Marathi</option>
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !topic}
                                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        <span>Generate Content</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Output Section */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Generated Result</h2>
                            {generatedContent && (
                                <button
                                    onClick={handleCopy}
                                    className={`flex items-center space-x-1 text-sm font-medium py-1 px-3 rounded-md transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                                </button>
                            )}
                        </div>

                        <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-y-auto max-h-[500px]">
                            {loading && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
                                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                    <p>AI is writing your content...</p>
                                </div>
                            )}

                            {!loading && !generatedContent && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Wand2 className="w-12 h-12 mb-2" />
                                    <p>Enter details and click Generate</p>
                                </div>
                            )}

                            {!loading && generatedContent && (
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800 font-medium">
                                    {generatedContent}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* History Sidebar - Desktop */}
            <div className="w-80 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700 flex items-center">
                        <History className="w-4 h-4 mr-2" />
                        History
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{history.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No history yet</p>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleLoadFromHistory(item)}
                                className="p-3 rounded-lg border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                                        {item.contentType}
                                    </span>
                                    <span className="text-[10px] text-gray-400 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-indigo-700">
                                    {item.title}
                                </h4>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                    {item.generatedContent}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentStudio;

