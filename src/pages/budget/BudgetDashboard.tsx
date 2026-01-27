import React, { useState, useEffect } from 'react';
import { IndianRupee, PieChart, TrendingUp, Plus, Edit2, Save, X, Calendar } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { BudgetService } from '../../services/budgetService';
import { type BudgetRecord } from '../../types';

const BudgetDashboard = () => {
    const { t } = useLanguage();
    const [year, setYear] = useState('2024-2025');
    const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<BudgetRecord>>({
        financialYear: '2024-2025',
        category: '',
        totalAllocation: 0,
        utilizedAmount: 0,
        status: 'Active'
    });

    // Stats
    const totalAllocated = budgets.reduce((sum, b) => sum + (b.totalAllocation || 0), 0);
    const totalUtilized = budgets.reduce((sum, b) => sum + (b.utilizedAmount || 0), 0);
    const utilizationPercentage = totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0;

    useEffect(() => {
        loadBudgets();
    }, [year]);

    const loadBudgets = async () => {
        setLoading(true);
        const data = await BudgetService.getBudgets(year);
        setBudgets(data);
        setLoading(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        await BudgetService.addBudget(formData as any);
        setIsModalOpen(false);
        // Reset form but keep year
        setFormData({
            financialYear: year,
            category: '',
            totalAllocation: 0,
            utilizedAmount: 0,
            area: '',
            status: 'Active'
        });
        loadBudgets();
    };

    const handleUpdateUtilization = async (id: string, current: number) => {
        const newAmount = prompt('Enter new total utilized amount:', current.toString());
        if (newAmount && !isNaN(Number(newAmount))) {
            await BudgetService.updateUtilization(id, Number(newAmount));
            loadBudgets();
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getProgressColor = (percent: number) => {
        if (percent < 50) return 'bg-green-500';
        if (percent < 80) return 'bg-yellow-500';
        return 'bg-red-500'; // High utilization usually good for budget? Or bad if overspent?
        // Typically for Govt budget: 
        // - Low utilization = Bad (Work not done)
        // - High utilization = Good (Work done)
        // Let's flip logic: Green > 80% (Great), Yellow > 50% (Good), Red < 50% (Poor progress)
        // Actually UI Convention: Green usually means "Safe/Good".
        // Let's stick to standard: Green (High utilization is good), Red (Low is bad)
        if (percent >= 80) return 'bg-green-500';
        if (percent >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('budget.title')}</h1>
                    <p className="text-gray-600">{t('budget.subtitle')}</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200">
                    <Calendar className="w-5 h-5 text-gray-500 ml-2" />
                    <select
                        className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                    >
                        <option value="2024-2025">FY 2024-2025</option>
                        <option value="2023-2024">FY 2023-2024</option>
                        <option value="2022-2023">FY 2022-2023</option>
                    </select>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">{t('budget.allocated')}</h3>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <IndianRupee className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAllocated)}</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Budget for {year}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">{t('budget.utilized')}</h3>
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <PieChart className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalUtilized)}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                        <div
                            className={`h-1.5 rounded-full ${getProgressColor(utilizationPercentage)}`}
                            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{utilizationPercentage.toFixed(1)}% Utilized</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">{t('budget.remaining')}</h3>
                        <div className="p-2 bg-green-50 rounded-lg">
                            <IndianRupee className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAllocated - totalUtilized)}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('budget.available')}</p>
                </div>
            </div>

            {/* Budget Heads */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">{t('budget.budget_heads')}</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-2 text-brand-600 hover:text-brand-700 font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('budget.add_allocation')}</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('budget.col_category')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('budget.col_allocated')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('budget.col_utilized')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('budget.col_progress')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('budget.col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">{t('budget.loading')}</td></tr>
                            ) : budgets.length > 0 ? (
                                budgets.map((budget) => {
                                    const percent = (budget.utilizedAmount / budget.totalAllocation) * 100;
                                    return (
                                        <tr key={budget.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {budget.category}
                                                {budget.area && <span className="block text-xs text-gray-400 font-normal">{budget.area}</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(budget.totalAllocation)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(budget.utilizedAmount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[140px]">
                                                    <div
                                                        className={`h-2.5 rounded-full ${getProgressColor(percent)}`}
                                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-gray-500 mt-1 inline-block">{percent.toFixed(0)}%</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleUpdateUtilization(budget.id, budget.utilizedAmount)}
                                                    className="text-brand-600 hover:text-brand-900 flex items-center justify-end gap-1 ml-auto"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Update
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No budget records found for this year.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">{t('budget.new_allocation_title')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('budget.financial_year')}</label>
                                <select
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 bg-white"
                                    value={formData.financialYear}
                                    onChange={e => setFormData({ ...formData, financialYear: e.target.value })}
                                >
                                    <option value="2024-2025">2024-2025</option>
                                    <option value="2023-2024">2023-2024</option>
                                    <option value="2022-2023">2022-2023</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('budget.category_head')}</label>
                                <input
                                    type="text" required
                                    placeholder="e.g. Road Maintenance"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('budget.area')}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Shivaji Nagar"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={formData.area || ''}
                                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('budget.amount')}</label>
                                <input
                                    type="number" required
                                    placeholder="0"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={formData.totalAllocation}
                                    onChange={e => setFormData({ ...formData, totalAllocation: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Initial Utilized Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                    value={formData.utilizedAmount}
                                    onChange={e => setFormData({ ...formData, utilizedAmount: Number(e.target.value) })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Allocation
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetDashboard;
