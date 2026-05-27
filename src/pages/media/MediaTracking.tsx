import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, ShieldAlert } from 'lucide-react';

export default function MediaTracking() {
    const { language } = useLanguage();
    const isMr = language === 'mr';

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 max-w-2xl mx-auto space-y-6 shadow-sm">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 animate-pulse">
                <Globe className="w-16 h-16" />
            </div>
            
            <div className="space-y-2">
                <h1 className="text-2xl font-extrabold text-slate-800">
                    {isMr ? 'माध्यम ट्रॅकिंग डॅशबोर्ड (Media Tracking)' : 'Media Tracking Dashboard'}
                </h1>
                <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                    {isMr 
                        ? 'लाइव्ह मीडिया आणि वृत्तपत्र बातम्या ट्रॅकर सध्या सुरक्षित लोकल मोडमध्ये उपलब्ध आहे. उत्पादन (Production) वातावरणात वापरण्यासाठी API क्रेडेन्शियल्स आवश्यक आहेत.'
                        : 'The live media and newspaper news tracker is currently active in secure local workspace mode. Production environments require custom scraping API credentials.'}
                </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl max-w-md text-left flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        {isMr ? 'सुरक्षा सूचना' : 'Security Notice'}
                    </p>
                    <p className="text-xs text-amber-700 leading-normal">
                        {isMr 
                            ? 'सुरक्षा नियमांनुसार, हे मॉड्यूल केवळ अधिकृत स्थानिक उपकरणांवर चालते. अधिक माहितीसाठी सिस्टम प्रशासकाशी संपर्क साधा.'
                            : 'In compliance with strict data regulations, this module runs strictly on authorized local hardware nodes. Contact your system admin for details.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
