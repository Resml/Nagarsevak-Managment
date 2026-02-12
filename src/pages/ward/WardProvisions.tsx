import React, { useState, useEffect } from 'react';
import { IndianRupee, Plus, Edit2, Save, X, Calendar, Search, ArrowLeft, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { TranslatedText } from '../../components/TranslatedText';
import { useTenant } from '../../context/TenantContext';
import { ProvisionService } from '../../services/provisionService';
import { type ProvisionRecord } from '../../types';
import { toast } from 'sonner';

const WardProvisions = () => {
    const { t } = useLanguage();
    const { tenantId } = useTenant();
    const navigate = useNavigate();
    const [year, setYear] = useState('2024-2025');
    const [provisions, setProvisions] = useState<ProvisionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedProvision, setSelectedProvision] = useState<ProvisionRecord | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<ProvisionRecord>>({
        title: '',
        description: '',
        requestedAmount: 0,
        sanctionedAmount: 0,
        requestedDate: new Date().toISOString().split('T')[0],
        sanctionedDate: '',
        status: 'Pending',
        financialYear: '2024-2025',
        category: '',
        letterReference: ''
    });

    const [updateData, setUpdateData] = useState({
        sanctionedAmount: 0,
        sanctionedDate: new Date().toISOString().split('T')[0],
        status: 'Approved' as ProvisionRecord['status']
    });

    useEffect(() => {
        loadProvisions();
    }, [year]);

    const loadProvisions = async () => {
        setLoading(true);
        try {
            const data = await ProvisionService.getProvisions(year);
            setProvisions(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load provision data');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await ProvisionService.addProvision({ ...formData as any, tenantId });
            setIsAddModalOpen(false);
            setFormData({
                title: '',
                description: '',
                requestedAmount: 0,
                sanctionedAmount: 0,
                requestedDate: new Date().toISOString().split('T')[0],
                sanctionedDate: '',
                status: 'Pending',
                financialYear: year,
                category: '',
                letterReference: ''
            });
            toast.success(t('ward_provision.success_add'));
            loadProvisions();
        } catch (error) {
            console.error(error);
            toast.error('Failed to add provision request');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProvision) return;

        try {
            await ProvisionService.updateProvision(selectedProvision.id, updateData);
            setIsUpdateModalOpen(false);
            toast.success(t('ward_provision.success_update'));
            loadProvisions();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update sanction details');
        }
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-green-50 text-green-700 border-green-200';
            case 'Partially Approved': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Approved': return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
            case 'Partially Approved': return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
            case 'Rejected': return <XCircle className="w-3.5 h-3.5 mr-1" />;
            default: return <Clock className="w-3.5 h-3.5 mr-1" />;
        }
    };

    const totalRequested = provisions.reduce((sum, p) => sum + (p.requestedAmount || 0), 0);
    const totalSanctioned = provisions.reduce((sum, p) => sum + (p.sanctionedAmount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Sticky Header Section */}
            <div className="sticky top-0 z-30 bg-slate-50 pt-1 pb-4 -mx-4 px-4 sm:-mx-8 sm:px-8 border-b border-slate-200/60 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{t('ward_provision.title')}</h1>
                            <p className="text-slate-500 text-sm">{t('ward_provision.subtitle')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 flex-1 sm:flex-none justify-center">
                            <Calendar className="w-4 h-4 text-slate-400 ml-1" />
                            <select
                                className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-700 w-full sm:w-auto"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                            >
                                <option value="2024-2025">FY 2024-2025</option>
                                <option value="2023-2024">FY 2023-2024</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="ns-btn-primary flex-1 sm:flex-none justify-center"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{t('ward_provision.add_request')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="ns-card p-6 bg-gradient-to-br from-white to-sky-50/30">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">{t('ward_provision.total_requested')}</h3>
                        <div className="p-2 bg-sky-50 border border-sky-100 rounded-xl text-sky-700 shadow-sm">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalRequested)}</p>
                    <p className="text-xs text-slate-500 mt-2 flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        {provisions.length} {t('ward_provision.pending_requests')}
                    </p>
                </div>

                <div className="ns-card p-6 bg-gradient-to-br from-white to-brand-50/30">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">{t('ward_provision.total_sanctioned')}</h3>
                        <div className="p-2 bg-brand-50 border border-brand-100 rounded-xl text-brand-700 shadow-sm">
                            <IndianRupee className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalSanctioned)}</p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4">
                        <div
                            className="h-1.5 rounded-full bg-brand-500"
                            style={{ width: `${totalRequested > 0 ? (totalSanctioned / totalRequested) * 100 : 0}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        {totalRequested > 0 ? ((totalSanctioned / totalRequested) * 100).toFixed(1) : 0}% success rate
                    </p>
                </div>
            </div>

            {/* Provisions Table */}
            <div className="ns-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('ward_provision.col_title')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('ward_provision.col_amount')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('ward_provision.col_status')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('ward_provision.col_date')}</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-8 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : provisions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center text-slate-400">
                                            <FileText className="w-12 h-12 mb-3 opacity-20" />
                                            <p>No provision records found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                provisions.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                                                <TranslatedText text={item.title} />
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center mt-1">
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider mr-2">
                                                    <TranslatedText text={item.category} />
                                                </span>
                                                <span className="truncate max-w-[200px]">Ref: {item.letterReference}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(item.sanctionedAmount || item.requestedAmount)}</div>
                                            {item.sanctionedAmount && item.sanctionedAmount < item.requestedAmount && (
                                                <div className="text-[10px] text-slate-400 line-through tabular-nums">req: {formatCurrency(item.requestedAmount)}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-bold border ${getStatusStyles(item.status)}`}>
                                                {getStatusIcon(item.status)}
                                                {t(`ward_provision.status_${item.status.toLowerCase().replace(' ', '_')}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 tabular-nums">
                                            {new Date(item.sanctionedDate || item.requestedDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedProvision(item);
                                                    setUpdateData({
                                                        sanctionedAmount: item.sanctionedAmount || item.requestedAmount,
                                                        sanctionedDate: item.sanctionedDate || new Date().toISOString().split('T')[0],
                                                        status: item.status === 'Pending' ? 'Approved' : item.status
                                                    });
                                                    setIsUpdateModalOpen(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">{t('ward_provision.add_request')}</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('ward_provision.form_title')}</label>
                                    <input
                                        required type="text"
                                        className="ns-input"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Enter project name..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('ward_provision.form_amount')}</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            required type="number"
                                            className="ns-input pl-9"
                                            value={formData.requestedAmount}
                                            onChange={e => setFormData({ ...formData, requestedAmount: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('ward_provision.col_date')}</label>
                                    <input
                                        required type="date"
                                        className="ns-input"
                                        value={formData.requestedDate}
                                        onChange={e => setFormData({ ...formData, requestedDate: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('ward_provision.form_category')}</label>
                                    <input
                                        required type="text"
                                        className="ns-input"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g. Roads, Water"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('ward_provision.form_year')}</label>
                                    <select
                                        className="ns-input"
                                        value={formData.financialYear}
                                        onChange={e => setFormData({ ...formData, financialYear: e.target.value })}
                                    >
                                        <option value="2024-2025">2024-2025</option>
                                        <option value="2023-2024">2023-2024</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('ward_provision.form_letter_ref')}</label>
                                    <input
                                        required type="text"
                                        className="ns-input"
                                        value={formData.letterReference}
                                        onChange={e => setFormData({ ...formData, letterReference: e.target.value })}
                                        placeholder="Letter No / Registry ID"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('ward_provision.form_desc')}</label>
                                    <textarea
                                        className="ns-input min-h-[100px]"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief details about the requirement..."
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="p-6 border-t border-slate-100 flex gap-3">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="ns-btn-ghost flex-1 justify-center border border-slate-200">
                                {t('improvements.cancel')}
                            </button>
                            <button onClick={handleAdd} className="ns-btn-primary flex-1 justify-center">
                                <Save className="w-4 h-4 mr-2" />
                                {t('budget.save_btn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Modal */}
            {isUpdateModalOpen && selectedProvision && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">{t('ward_provision.update_sanction')}</h2>
                            <button onClick={() => setIsUpdateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Project</div>
                                <div className="text-sm font-bold text-slate-700"><TranslatedText text={selectedProvision.title} /></div>
                                <div className="text-xs text-slate-500 mt-1">Requested: {formatCurrency(selectedProvision.requestedAmount)}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('ward_provision.sanctioned_amount')}</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        required type="number"
                                        className="ns-input pl-9 text-lg font-bold text-brand-700"
                                        value={updateData.sanctionedAmount}
                                        onChange={e => setUpdateData({ ...updateData, sanctionedAmount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('ward_provision.sanctioned_date')}</label>
                                <input
                                    required type="date"
                                    className="ns-input"
                                    value={updateData.sanctionedDate}
                                    onChange={e => setUpdateData({ ...updateData, sanctionedDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">{t('ward_provision.col_status')}</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    {['Approved', 'Partially Approved', 'Pending', 'Rejected'].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setUpdateData({ ...updateData, status: s as any })}
                                            className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${updateData.status === s
                                                ? 'bg-brand-500 text-white border-brand-600 shadow-md'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                                                }`}
                                        >
                                            {t(`ward_provision.status_${s.toLowerCase().replace(' ', '_')}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="ns-btn-ghost flex-1 justify-center border border-slate-200">
                                    {t('improvements.cancel')}
                                </button>
                                <button type="submit" className="ns-btn-primary flex-1 justify-center shadow-lg shadow-brand-200">
                                    <Save className="w-4 h-4 mr-2" />
                                    {t('budget.update_btn')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WardProvisions;
