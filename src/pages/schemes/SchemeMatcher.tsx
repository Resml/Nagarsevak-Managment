import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, Sparkles, CheckCircle } from 'lucide-react';
import { AIAnalysisService } from '../../services/aiService';

interface SchemeMatcherProps {
    schemes: any[];
    onClose: () => void;
    onMatch: (matchedIds: number[]) => void;
}

const SchemeMatcher: React.FC<SchemeMatcherProps> = ({ schemes, onClose, onMatch }) => {
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Male');
    const [income, setIncome] = useState('');
    const [occupation, setOccupation] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleSearch = async () => {
        if (!age || !income || !occupation) return;

        setIsAnalyzing(true);
        const profile = `Age: ${age}, Gender: ${gender}, Annual Income: ${income}, Occupation: ${occupation}`;

        try {
            const matchedIds = await AIAnalysisService.matchSchemes(profile, schemes);
            onMatch(matchedIds);
            // Don't close immediately, let them see "Found X schemes" or something, but for MVP we match and filter parent.
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to match schemes.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="ns-card w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 flex justify-between items-center bg-slate-50 border-b border-slate-200/70">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-700" /> Find matching schemes
                    </h2>
                    <button onClick={onClose} className="ns-btn-ghost border border-slate-200 px-2 py-2">
                        <X className="w-5 h-5 text-slate-700" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                        <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="ns-input"
                            placeholder="e.g. 25"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="ns-input"
                        >
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Annual income (₹)</label>
                        <input
                            type="number"
                            value={income}
                            onChange={(e) => setIncome(e.target.value)}
                            className="ns-input"
                            placeholder="e.g. 100000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                        <input
                            type="text"
                            value={occupation}
                            onChange={(e) => setOccupation(e.target.value)}
                            className="ns-input"
                            placeholder="e.g. Student, Farmer, Small Business"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleSearch}
                            disabled={isAnalyzing}
                            className="ns-btn-primary w-full justify-center py-2.5 disabled:opacity-70"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Sparkles className="w-4 h-4 animate-spin" /> Analyzing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" /> Check Eligibility
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchemeMatcher;
