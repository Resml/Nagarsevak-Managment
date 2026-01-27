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

    useEffect(() => {
        const all = MockService.getComplaints();
        // In history, we typically show resolved/closed items
        const resolved = all.filter(c => c.status === 'Resolved' || c.status === 'Closed');
        setHistory(resolved);
    }, []);

    const filteredHistory = filterWard === 'All'
        ? history
        : history.filter(h => h.ward === filterWard);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('work_history.title')}</h1>
                    <p className="text-sm text-gray-500">{t('work_history.subtitle')}</p>
                </div>
                <button className="flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 bg-white">
                    <Download className="w-4 h-4" />
                    <span>{t('work_history.export_report')}</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex items-center space-x-4 bg-gray-50">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Filter className="w-4 h-4" />
                        <span>{t('work_history.filter_ward')}</span>
                    </div>
                    <select
                        value={filterWard}
                        onChange={(e) => setFilterWard(e.target.value)}
                        className="border-gray-300 rounded-md text-sm py-1.5 focus:ring-brand-500 focus:border-brand-500"
                    >
                        <option value="All">{t('work_history.all_wards')}</option>
                        <option value="12">{t('work_history.ward_12')}</option>
                        <option value="13">{t('work_history.ward_13')}</option>
                        <option value="14">{t('work_history.ward_14')}</option>
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('work_history.col_date')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('work_history.col_title')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('work_history.col_ward')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('work_history.col_type')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('work_history.col_beneficiary')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredHistory.length > 0 ? filteredHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.resolvedAt ? format(new Date(item.resolvedAt), 'MMM d, yyyy') : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</div>
                                        <div className="text-xs text-gray-500 line-clamp-1">{item.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.ward}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.voterId ? 'Registered Voter' : 'Citizen'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
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
