import React, { useState, useEffect } from 'react';
import { PieChart, Users, CheckCircle, XCircle } from 'lucide-react';
import { ResultService } from '../../services/resultService';
import { type ElectionResult } from '../../types';

const CANDIDATE_NAME = "Mamit Chougale";

const ResultAnalysis = () => {
    const [ward, setWard] = useState('Prabhag 5 A');
    const [results, setResults] = useState<ElectionResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadResults();
    }, [ward]);

    const loadResults = async () => {
        setLoading(true);
        const data = await ResultService.getResults(ward);
        setResults(data);
        setLoading(false);
    };

    // Calculations
    const totalVotes = results.reduce((sum, r) => sum + r.totalVotesCasted, 0);
    const ourVotes = results.reduce((sum, r) => sum + (r.candidateVotes[CANDIDATE_NAME] || 0), 0);
    const voteShare = totalVotes > 0 ? (ourVotes / totalVotes) * 100 : 0;

    const winningBooths = results.filter(r => r.winner === CANDIDATE_NAME).length;
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Election Result Analysis</h1>
                    <p className="text-gray-600">Performance report for {CANDIDATE_NAME}</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium text-gray-500 ml-2">Select Ward:</span>
                    <select
                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-brand-600"
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                    >
                        <option value="Prabhag 5 A">Prabhag 5 A</option>
                        <option value="Prabhag 5 B">Prabhag 5 B</option>
                        <option value="Prabhag 5 C">Prabhag 5 C</option>
                        <option value="Prabhag 5 D">Prabhag 5 D</option>
                    </select>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booth No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Casted</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Our Votes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visual</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead/Trail</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : sortedResults.map((r) => {
                                const ourV = r.candidateVotes[CANDIDATE_NAME] || 0;
                                const isWin = r.winner === CANDIDATE_NAME;
                                return (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {r.boothNumber}
                                            <span className="block text-xs text-gray-500 font-normal">{r.boothName}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.totalVotesCasted}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{ourV}</td>
                                        <td className="px-6 py-4 whitespace-nowrap align-middle w-48">
                                            <div className="flex h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-brand-500 h-full"
                                                    style={{ width: getBarWidth(ourV, r.totalVotesCasted) }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500 mt-1">{((ourV / r.totalVotesCasted) * 100).toFixed(1)}%</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={isWin ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                                {isWin ? '+' : '-'}{r.margin}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isWin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {isWin ? 'Won' : 'Lost'}
                                            </span>
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
