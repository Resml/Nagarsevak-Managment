import { useEffect, useState } from 'react';
import { MockService } from '../../services/mockData';
import { useLanguage } from '../../context/LanguageContext';
import { type Complaint } from '../../types';
import { Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

const History = () => {
    const { t } = useLanguage();
    const [history, setHistory] = useState<Complaint[]>([]);
    const [filterWard, setFilterWard] = useState<string>('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate network delay for loading state
        setTimeout(() => {
            const all = MockService.getComplaints();
            // In history, we typically show resolved/closed items
            const resolved = all.filter(c => c.status === 'Resolved' || c.status === 'Closed');
            setHistory(resolved);
            setLoading(false);
        }, 800);
    }, []);

    const filteredHistory = filterWard === 'All'
        ? history
        : history.filter(h => h.ward === filterWard);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('work_history.title')}</h1>
                    <p className="text-sm text-slate-500">{t('work_history.subtitle')}</p>
                </div>
                <button className="ns-btn-ghost border border-slate-200">
                    <Download className="w-4 h-4" />
                    <span>{t('work_history.export_report')}</span>
                </button>
            </div>

            <div className="ns-card overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200/70 flex items-center space-x-4 bg-slate-50">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Filter className="w-4 h-4" />
                        <span>{t('work_history.filter_ward')}</span>
                    </div>
                    <select
                        value={filterWard}
                        onChange={(e) => setFilterWard(e.target.value)}
                        className="ns-input text-sm py-1.5"
                    >
                        <option value="All">{t('work_history.all_wards')}</option>
                        <option value="12">{t('work_history.ward_12')}</option>
                        <option value="13">{t('work_history.ward_13')}</option>
                        <option value="14">{t('work_history.ward_14')}</option>
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200/70">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('work_history.col_date')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('work_history.col_title')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('work_history.col_ward')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('work_history.col_type')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('work_history.col_beneficiary')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200/70">
                            {loading ? (
                                <>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse" /></td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 w-48 bg-slate-200 rounded animate-pulse mb-2" />
                                                <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 w-12 bg-slate-200 rounded animate-pulse" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse" /></td>
                                        </tr>
                                    ))}
                                </>
                            ) : filteredHistory.length > 0 ? filteredHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {item.resolvedAt ? format(new Date(item.resolvedAt), 'MMM d, yyyy') : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-slate-900 line-clamp-1">{item.title}</div>
                                        <div className="text-xs text-slate-500 line-clamp-1">{item.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {item.ward}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {item.voterId ? 'Registered Voter' : 'Citizen'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No resolved works found in records.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default History;
