import React, { useState, useEffect } from 'react';
import { PieChart, Users, CheckCircle, XCircle } from 'lucide-react';
import { ResultService } from '../../services/resultService';
import { type ElectionResult } from '../../types';

const CANDIDATE_NAME = "Mamit Chougale";

const ResultAnalysis = () => {
    const [ward, setWard] = useState('Prabhag 5 A');
    const [results, setResults] = useState<ElectionResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(CANDIDATE_NAME);
    const [availableCandidates, setAvailableCandidates] = useState<string[]>([]);

    useEffect(() => {
        loadResults();
    }, [ward]);

    // Update available candidates and default selection when results change
    useEffect(() => {
        if (results.length > 0) {
            const candidates = Object.keys(results[0].candidateVotes);
            setAvailableCandidates(candidates);

            // Try to find Mamit first, else default to winner or first candidate
            const mamit = candidates.find(k => k.includes('ममित') || k.includes('Mamit') || k.includes('Chougale'));

            // If the currently selected candidate is NOT in the new list, switch.
            if (!candidates.includes(selectedCandidate)) {
                if (mamit) {
                    setSelectedCandidate(mamit);
                } else {
                    // Default to the candidate with max total votes to show winning party stats
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
            } else {
                // If current selection is still valid, do nothing (keep selection)
                // UNLESS we just switched wards and Mamit exists here, we might want to prefer Mamit?
                // Actually sticking to user choice is usually better, but if we switch wards, maybe reset?
                // Let's reset to "Smart Default" on ward change.
                if (mamit) {
                    setSelectedCandidate(mamit);
                } else {
                    // Default to max votes
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
        }
    }, [results]);

    const loadResults = async () => {
        setLoading(true);
        const data = await ResultService.getResults(ward);
        setResults(data);
        setLoading(false);
    };

    // Calculations based on SELECTED Candidate
    const totalVotes = results.reduce((sum, r) => sum + r.totalVotesCasted, 0);
    const ourVotes = results.reduce((sum, r) => sum + (r.candidateVotes[selectedCandidate] || 0), 0);
    const voteShare = totalVotes > 0 ? (ourVotes / totalVotes) * 100 : 0;

    const winningBooths = results.filter(r => r.winner === selectedCandidate).length;
    const losingBooths = results.length - winningBooths;

    // Sort booths by margin (Losses first to analyze weak points, or Wins to celebrate?)
    // Let's sort by booth number for standard view
    const sortedResults = [...results].sort((a, b) => Number(a.boothNumber) - Number(b.boothNumber));

    const getBarWidth = (votes: number, total: number) => {
        if (total === 0) return '0%';
        return `${(votes / total) * 100}%`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Election Result Analysis</h1>
                    <p className="text-gray-600">Performance report for <span className="font-semibold text-brand-600">{selectedCandidate}</span></p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-500 ml-2">Ward:</span>
                        <select
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 max-w-[120px]"
                            value={ward}
                            onChange={(e) => setWard(e.target.value)}
                        >
                            <option value="Prabhag 5 A">Prabhag 5 A</option>
                            <option value="Prabhag 5 B">Prabhag 5 B</option>
                            <option value="Prabhag 5 C">Prabhag 5 C</option>
                            <option value="Prabhag 5 D">Prabhag 5 D</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-500 ml-2">Analyze For:</span>
                        <select
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-brand-600 max-w-[200px]"
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500 text-sm">Total Votes</span>
                        <Users className="w-5 h-5 text-blue-500" />
                    </div>

                    <p className="text-2xl font-bold text-gray-900">{ourVotes.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">out of {totalVotes.toLocaleString()} casted</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500 text-sm">Vote Share</span>
                        <PieChart className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{voteShare.toFixed(1)}%</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${voteShare}%` }}></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500 text-sm">Winning Booths</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{winningBooths}</p>
                    <p className="text-xs text-gray-500">Strongholds</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500 text-sm">Losing Booths</span>
                        <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{losingBooths}</p>
                    <p className="text-xs text-gray-500">Need improvement</p>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Booth-wise Performance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">Booth No</th>
                                {sortedResults.length > 0 && Object.keys(sortedResults[0].candidateVotes).map(candidate => (
                                    <th key={candidate} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                        <span className="line-clamp-2" title={candidate}>{candidate}</span>
                                    </th>
                                ))}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={10} className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : sortedResults.map((r) => {
                                const candidates = Object.keys(r.candidateVotes);
                                const ourV = r.candidateVotes[selectedCandidate] || 0;
                                return (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                                            {r.boothNumber}
                                            {/* <span className="block text-xs text-gray-500 font-normal">{r.boothName}</span> */}
                                        </td>
                                        {candidates.map(c => {
                                            const votes = r.candidateVotes[c];
                                            const isWin = r.winner === c;
                                            const isSelected = c === selectedCandidate;
                                            return (
                                                <td key={c} className={`px-6 py-4 whitespace-nowrap text-sm ${isWin ? 'font-bold text-green-700 bg-green-50' : isSelected ? 'font-medium text-brand-700 bg-brand-50' : 'text-gray-500'}`}>
                                                    {votes}
                                                </td>
                                            );
                                        })}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{r.totalVotesCasted}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-600 font-medium truncate max-w-[150px]" title={r.winner}>
                                            {r.winner}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {r.margin}
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Totals Row */}
                            {!loading && sortedResults.length > 0 && (
                                <tr className="bg-gray-100 font-bold">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-gray-100">TOTAL</td>
                                    {Object.keys(sortedResults[0].candidateVotes).map(c => (
                                        <td key={c} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {sortedResults.reduce((sum, r) => sum + (r.candidateVotes[c] || 0), 0).toLocaleString()}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {sortedResults.reduce((sum, r) => sum + r.totalVotesCasted, 0).toLocaleString()}
                                    </td>
                                    <td colSpan={2}></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ResultAnalysis;
