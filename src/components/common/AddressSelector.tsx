import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Search, MapPin } from 'lucide-react';

interface AddressSelectorProps {
    value: string;
    onChange: (value: string) => void;
    allVoterAddresses: string[];
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
    value,
    onChange,
    allVoterAddresses,
}) => {
    const { t, language } = useLanguage();
    const isMr = language === 'mr';
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Close suggestions dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Compute filtered suggestions based on value (searchQuery)
    const filteredSuggestions = value.trim().length > 0
        ? allVoterAddresses.filter(addr =>
            addr.toLowerCase().includes(value.toLowerCase())
          ).slice(0, 50)
        : allVoterAddresses.slice(0, 50);

    return (
        <div className="space-y-3">
            <div ref={searchRef} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
                <input
                    type="text"
                    placeholder={isMr ? 'पत्ता टाइप करा किंवा शोधा...' : 'Type or search address...'}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="ns-input pl-12 pr-4 py-4 w-full bg-white font-semibold text-slate-800 border-slate-300 focus:ring-brand-500 focus:border-brand-500 rounded-xl text-sm shadow-sm"
                />
                {value && (
                    <button
                        onClick={() => { onChange(''); setShowSuggestions(false); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg font-bold z-10"
                    >×</button>
                )}

                {/* DROPDOWN SUGGESTIONS */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto">
                        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {filteredSuggestions.length} {isMr ? 'पत्ते सापडले' : 'addresses found'}
                            </span>
                            <button onClick={() => setShowSuggestions(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                        </div>
                        {filteredSuggestions.map((addr, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    onChange(addr);
                                    setShowSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-800 border-b border-slate-50 last:border-0 transition-colors flex items-center gap-2"
                            >
                                <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                                <span className="truncate">{addr}</span>
                            </button>
                        ))}
                    </div>
                )}

                {showSuggestions && value.trim().length > 0 && filteredSuggestions.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 px-4 py-4 text-center">
                        <p className="text-sm text-slate-400 font-semibold">
                            {isMr ? 'हा पत्ता मतदार यादीत सापडला नाही' : 'No voter address matched'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {isMr ? 'तरीही अहवाल तयार करू शकता' : 'You can still generate a report'}
                        </p>
                    </div>
                )}
            </div>

            {/* COMPLETE UNIQUE ADDRESS DROPDOWN */}
            {allVoterAddresses.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {isMr ? 'किंवा सर्व पत्त्यांच्या यादीतून निवडा:' : 'Or select from complete address dropdown:'}
                    </p>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10 pointer-events-none" />
                        <select
                            value={value}
                            onChange={(e) => {
                                onChange(e.target.value);
                                setShowSuggestions(false);
                            }}
                            className="pl-12 pr-10 py-4 w-full bg-white font-semibold text-slate-800 border border-slate-300 focus:ring-brand-500 focus:border-brand-500 rounded-xl text-sm shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="">{isMr ? '-- सर्व पत्ते --' : '-- All Addresses --'}</option>
                            {allVoterAddresses.map((addr, idx) => (
                                <option key={idx} value={addr}>
                                    {addr}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold">
                            ▼
                        </div>
                    </div>
                </div>
            )}

            {/* Quick area chips — first 20 from DB */}
            {allVoterAddresses.length > 0 && !value && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {isMr ? 'मतदार यादीतील पत्ते:' : 'Addresses from voter database:'}
                    </p>
                    <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto font-sans">
                        {allVoterAddresses.slice(0, 20).map((addr, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    onChange(addr);
                                    setShowSuggestions(false);
                                }}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors bg-white hover:bg-brand-50 hover:border-brand-300 border-slate-200 text-slate-600 truncate max-w-[200px]"
                                title={addr}
                            >
                                📍 {addr.length > 30 ? addr.substring(0, 30) + '…' : addr}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressSelector;
