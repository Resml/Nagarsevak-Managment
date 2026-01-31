import React, { useState, useEffect } from 'react';
import { IndianRupee, PieChart, TrendingUp, Plus, Edit2, Save, X, Calendar, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { BudgetService } from '../../services/budgetService';
import { type BudgetRecord } from '../../types';
import { toast } from 'sonner';

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

        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.relative')) {
                setShowAreaDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [year]);

    const loadBudgets = async () => {
        setLoading(true);
        try {
            const data = await BudgetService.getBudgets(year);
            setBudgets(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load budget data');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
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
            toast.success('Budget allocated successfully');
            loadBudgets();
        } catch (error) {
            console.error(error);
            toast.error('Failed to allocate budget');
        }
    };

    const handleUpdateUtilization = async (id: string, current: number) => {
        const newAmount = prompt('Enter new total utilized amount:', current.toString());
        if (newAmount && !isNaN(Number(newAmount))) {
            try {
                await BudgetService.updateUtilization(id, Number(newAmount));
                toast.success('Utilization updated successfully');
                loadBudgets();
            } catch (error) {
                console.error(error);
                toast.error('Failed to update utilization');
            }
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
        if (percent >= 80) return 'bg-green-500';
        if (percent >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Filter Logic
    const [searchTerm, setSearchTerm] = useState('');
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);

    const filteredBudgets = budgets.filter(b => {
        const matchesSearch =
            (b.category && b.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (b.area && b.area.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesArea = !areaSearch || (b.area && b.area.toLowerCase().includes(areaSearch.toLowerCase()));

        return matchesSearch && matchesArea;
    });

    const uniqueAreas = Array.from(new Set(budgets.map(b => b.area).filter(Boolean))).sort();

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('budget.title')}</h1>
                        <p className="text-slate-500">{t('budget.subtitle')}</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                        <Calendar className="w-4 h-4 text-slate-400 ml-1" />
                        <select
                            className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-700"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            <option value="2024-2025">FY 2024-2025</option>
                            <option value="2023-2024">FY 2023-2024</option>
                            <option value="2022-2023">FY 2022-2023</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="ns-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">{t('budget.allocated')}</h3>
                        <div className="p-2 bg-sky-50 border border-sky-100 rounded-xl text-sky-700">
                            <IndianRupee className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalAllocated)}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1 text-slate-400" />
                        Financial year {year}
                    </p>
                </div>

                <div className="ns-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">{t('budget.utilized')}</h3>
                        <div className="p-2 bg-brand-50 border border-brand-100 rounded-xl text-brand-700">
                            <PieChart className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalUtilized)}</p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                        <div
                            className={`h-1.5 rounded-full ${getProgressColor(utilizationPercentage)}`}
                            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{utilizationPercentage.toFixed(1)}% utilized</p>
                </div>

                <div className="ns-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">{t('budget.remaining')}</h3>
                        <div className="p-2 bg-green-50 border border-green-100 rounded-xl text-green-700">
                            <IndianRupee className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalAllocated - totalUtilized)}</p>
                    <p className="text-xs text-slate-500 mt-1">{t('budget.available')}</p>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('budget.search_placeholder') || "Search budgets..."}
                        className="ns-input pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Filter by Area..."
                        className="ns-input w-full"
                        value={areaSearch}
                        onFocus={() => setShowAreaDropdown(true)}
                        onChange={(e) => setAreaSearch(e.target.value)}
                    />
                    {showAreaDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {uniqueAreas.filter(area => (area as string).toLowerCase().includes(areaSearch.toLowerCase())).map((area) => (
                                <div
                                    key={area as string}
                                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
                                    onClick={() => {
                                        setAreaSearch(area as string);
                                        setShowAreaDropdown(false);
                                    }}
                                >
                                    {area as string}
                                </div>
                            ))}
                            {uniqueAreas.filter(area => (area as string).toLowerCase().includes(areaSearch.toLowerCase())).length === 0 && (
                                <div className="px-4 py-2 text-sm text-slate-500 italic">No areas found</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Budget Heads */}
            <div className="ns-card">
                <div className="p-6 border-b border-slate-200/70 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-900">{t('budget.budget_heads')}</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="ns-btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('budget.add_allocation')}</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200/70">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('budget.col_category')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('budget.col_allocated')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('budget.col_utilized')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('budget.col_progress')}</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('budget.col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200/70">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">{t('budget.loading')}</td></tr>
                            ) : filteredBudgets.length > 0 ? (
                                filteredBudgets.map((budget) => {
                                    const percent = (budget.utilizedAmount / budget.totalAllocation) * 100;
                                    return (
                                        <tr key={budget.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                                {budget.category}
                                                {budget.area && <span className="block text-xs text-slate-500 font-normal">{budget.area}</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 tabular-nums">{formatCurrency(budget.totalAllocation)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 tabular-nums">{formatCurrency(budget.utilizedAmount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                <div className="w-full bg-slate-200/70 rounded-full h-2.5 max-w-[140px]">
                                                    <div
                                                        className={`h-2.5 rounded-full ${getProgressColor(percent)}`}
                                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-slate-500 mt-1 inline-block tabular-nums">{percent.toFixed(0)}%</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleUpdateUtilization(budget.id, budget.utilizedAmount)}
                                                    className="ns-btn-ghost border border-slate-200 ml-auto"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Update
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">No budget records found for this year.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200/70">
                            <h2 className="text-xl font-bold text-slate-900">{t('budget.new_allocation_title')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('budget.financial_year')}</label>
                                <select
                                    className="ns-input mt-1"
                                    value={formData.financialYear}
                                    onChange={e => setFormData({ ...formData, financialYear: e.target.value })}
                                >
                                    <option value="2024-2025">2024-2025</option>
                                    <option value="2023-2024">2023-2024</option>
                                    <option value="2022-2023">2022-2023</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('budget.category_head')}</label>
                                <input
                                    type="text" required
                                    placeholder="e.g. Road Maintenance"
                                    className="ns-input mt-1"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('budget.area')}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Shivaji Nagar"
                                    className="ns-input mt-1"
                                    value={formData.area || ''}
                                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('budget.amount')}</label>
                                <input
                                    type="number" required
                                    placeholder="0"
                                    className="ns-input mt-1"
                                    value={formData.totalAllocation}
                                    onChange={e => setFormData({ ...formData, totalAllocation: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">Initial utilized amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="ns-input mt-1"
                                    value={formData.utilizedAmount}
                                    onChange={e => setFormData({ ...formData, utilizedAmount: Number(e.target.value) })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="ns-btn-primary w-full justify-center"
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
