import React, { useState, useEffect } from 'react';
import { PieChart, Users, CheckCircle, XCircle } from 'lucide-react';
import { ResultService } from '../../services/resultService';
import { type ElectionResult } from '../../types';

import { useLanguage } from '../../context/LanguageContext';

const ResultAnalysis = () => {
    const { t } = useLanguage();
    const [ward, setWard] = useState('');
    const [availableWards, setAvailableWards] = useState<string[]>([]);
    const [results, setResults] = useState<ElectionResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState('');
    const [availableCandidates, setAvailableCandidates] = useState<string[]>([]);

    // Fetch all wards on mount
    useEffect(() => {
        loadAllWards();
    }, []);

    useEffect(() => {
        if (ward) {
            loadResults();
        }
    }, [ward]);

    // Update available candidates and default selection when results change
    useEffect(() => {
        if (results.length > 0) {
            const candidates = Object.keys(results[0].candidateVotes);
            setAvailableCandidates(candidates);

            // If the currently selected candidate is NOT in the new list, switch to winner
            if (!candidates.includes(selectedCandidate)) {
                // Default to the candidate with max total votes
                let maxVotes = -1;
                let bestCand = candidates[0];
                candidates.forEach(c => {
                    const total = results.reduce((sum, r) => sum + (r.candidateVotes[c] || 0), 0);
                    if (total > maxVotes) {
                        maxVotes = total;
                        bestCand = c;
                    }
                });
                setSelectedCandidate(bestCand);
            }
        }
    }, [results]);

    const loadAllWards = async () => {
        const allResults = await ResultService.getResults();
        const uniqueWards = [...new Set(allResults.map(r => r.wardName))].filter(Boolean);
        setAvailableWards(uniqueWards);

        // Auto-select first ward if available
        if (uniqueWards.length > 0 && !ward) {
            setWard(uniqueWards[0]);
        }
    };

    const loadResults = async () => {
        setLoading(true);
        const data = await ResultService.getResults(ward);
        setResults(data);
        setLoading(false);
    };

    // Get the "एकूण मत" row for total calculations
    const totalVotesRow = results.find(r => r.boothNumber === 'एकूण मत');
    const totalVotes = totalVotesRow ? totalVotesRow.totalVotesCasted : results.reduce((sum, r) => sum + r.totalVotesCasted, 0);
    const ourVotes = totalVotesRow ? (totalVotesRow.candidateVotes[selectedCandidate] || 0) : results.reduce((sum, r) => sum + (r.candidateVotes[selectedCandidate] || 0), 0);
    const voteShare = totalVotes > 0 ? (ourVotes / totalVotes) * 100 : 0;

    const winningBooths = results.filter(r => r.winner === selectedCandidate).length;
    const losingBooths = results.length - winningBooths;

    // Sort booths by booth number
    const sortedResults = [...results].sort((a, b) => {
        const aNum = a.boothNumber.match(/\d+/);
        const bNum = b.boothNumber.match(/\d+/);
        if (aNum && bNum) {
            return Number(aNum[0]) - Number(bNum[0]);
        }
        return a.boothNumber.localeCompare(b.boothNumber);
    });

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('election.title')}</h1>
                        <p className="text-slate-600">{t('election.performance_report')} <span className="font-semibold text-brand-700">{selectedCandidate}</span></p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                            <span className="text-sm font-medium text-slate-500 ml-1">{t('voters.ward')}:</span>
                            <select
                                className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-700 min-w-[140px]"
                                value={ward}
                                onChange={(e) => setWard(e.target.value)}
                            >
                                {availableWards.map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                            <span className="text-sm font-medium text-slate-500 ml-1">{t('election.analyze_for')}</span>
                            <select
                                className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-brand-700 min-w-[200px]"
                                value={selectedCandidate}
                                onChange={(e) => setSelectedCandidate(e.target.value)}
                            >
                                {availableCandidates.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="ns-card p-5">
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-500 text-sm">{t('election.total_votes')}</span>
                        <Users className="w-5 h-5 text-blue-500" />
                    </div>

                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{ourVotes.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{t('election.votes_cast').replace('{{total}}', totalVotes.toLocaleString())}</p>
                </div>
                <div className="ns-card p-5">
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-500 text-sm">{t('election.vote_share')}</span>
                        <PieChart className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{voteShare.toFixed(1)}%</p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${voteShare}%` }}></div>
                    </div>
                </div>
                <div className="ns-card p-5">
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-500 text-sm">{t('election.winning_booths')}</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{winningBooths}</p>
                    <p className="text-xs text-slate-500">{t('election.strongholds')}</p>
                </div>
                <div className="ns-card p-5">
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-500 text-sm">{t('election.losing_booths')}</span>
                        <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{losingBooths}</p>
                    <p className="text-xs text-slate-500">{t('election.needs_improvement')}</p>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="ns-card overflow-hidden">
                <div className="p-6 border-b border-slate-200/70">
                    <h2 className="text-lg font-semibold text-slate-900">{t('election.booth_performance')}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200/70">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50">केंद्र क्र.</th>
                                {sortedResults.length > 0 && Object.keys(sortedResults[0].candidateVotes).map(candidate => (
                                    <th key={candidate} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
                                        <span className="line-clamp-2" title={candidate}>{candidate}</span>
                                    </th>
                                ))}
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">एकूण</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">विजयी</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">फरक</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200/70">
                            {/* Filter out summary rows */}
                            {loading ? (
                                <tr><td colSpan={20} className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : sortedResults.filter(r => !['सर्व मतदान केंद्र नोंदवण्यात आलेली मते', 'टपाल मतदान'].includes(r.boothNumber)).map((r) => {
                                const candidates = Object.keys(r.candidateVotes);
                                return (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 sticky left-0 bg-white">
                                            {r.boothNumber}
                                        </td>
                                        {candidates.map(c => {
                                            const votes = r.candidateVotes[c];
                                            const isWin = r.winner === c;
                                            const isSelected = c === selectedCandidate;
                                            return (
                                                <td key={c} className={`px-6 py-4 whitespace-nowrap text-sm ${isWin ? 'font-bold text-green-700 bg-green-50' : isSelected ? 'font-semibold text-brand-800 bg-brand-50/60' : 'text-slate-500'}`}>
                                                    {votes}
                                                </td>
                                            );
                                        })}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 tabular-nums">{r.totalVotesCasted}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-700 font-semibold truncate max-w-[150px]" title={r.winner}>
                                            {r.winner}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {r.margin}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ResultAnalysis;
