import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { X, Search, User, Phone, MapPin, Loader2, CheckCircle, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';

// Types
interface Scheme {
    id: number;
    name: string;
}

interface Voter {
    id: string;
    name: string;
    name_english?: string;
    name_marathi?: string;
    age: number;
    gender: string;
    address: string;
    address_english?: string;
    address_marathi?: string;
    mobile?: string;
    epicNo?: string;
}

interface SchemeApplicationModalProps {
    scheme: Scheme;
    onClose: () => void;
    onSuccess?: () => void;
}

const SchemeApplicationModal: React.FC<SchemeApplicationModalProps> = ({ scheme, onClose, onSuccess }) => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();

    // Form State
    const [applicantName, setApplicantName] = useState('');
    const [mobile, setMobile] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [benefit, setBenefit] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedVoterId, setSelectedVoterId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search State
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [nameFilter, setNameFilter] = useState('');
    const [searchResults, setSearchResults] = useState<Voter[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // --- Search Logic (Simplified from ComplaintForm) ---
    useEffect(() => {
        if (!nameFilter || !isSearchMode) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                let query = supabase.from('voters').select('*').eq('tenant_id', tenantId).limit(10); // Secured

                if (/^\d+$/.test(nameFilter)) {
                    query = query.ilike('mobile', `%${nameFilter}%`);
                } else {
                    query = query.or(`name_english.ilike.%${nameFilter}%,name_marathi.ilike.%${nameFilter}%,epic_no.ilike.%${nameFilter}%`);
                }
                const { data } = await query;
                setSearchResults(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [nameFilter, tenantId, isSearchMode]); // Added tenantId

    const handleSelectVoter = (voter: Voter) => {
        setSelectedVoterId(voter.id);
        const name = language === 'mr' ? (voter.name_marathi || voter.name_english || voter.name || '') : (voter.name_english || voter.name || '');
        setApplicantName(name);
        setMobile(voter.mobile || '');
        setAddress(language === 'mr' ? (voter.address_marathi || voter.address) : voter.address);
        setIsSearchMode(false);
        toast.success('Voter linked successfully');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('scheme_applications').insert([{
                scheme_id: scheme.id,
                voter_id: selectedVoterId ? parseInt(selectedVoterId) : null,
                applicant_name: applicantName,
                mobile: mobile,
                address: address,
                notes: notes,
                benefit: benefit,
                rejection_reason: rejectionReason,
                status: 'Pending',
                tenant_id: tenantId // Secured
            }]);

            if (error) throw error;
            toast.success('Application submitted successfully');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Failed to submit application');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="ns-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Apply for Scheme</h3>
                        <p className="text-sm text-brand-600 font-medium truncate max-w-[300px]">{scheme.name}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
                    {/* Search Toggle */}
                    {!isSearchMode && (
                        <div className="mb-6 bg-white p-4 rounded-xl border border-dashed border-brand-200 flex flex-col items-center justify-center text-center">
                            <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center mb-2">
                                <Search className="w-5 h-5 text-brand-600" />
                            </div>
                            <h4 className="font-semibold text-slate-900 mb-1">Link a Voter?</h4>
                            <p className="text-xs text-slate-500 mb-3">Search and select a voter to auto-fill details</p>
                            <button
                                onClick={() => setIsSearchMode(true)}
                                className="ns-btn-secondary text-sm py-1.5"
                            >
                                Search Voter List
                            </button>
                        </div>
                    )}

                    {/* Search Mode UI */}
                    {isSearchMode && (
                        <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 mb-2">
                                <button onClick={() => setIsSearchMode(false)} className="text-xs text-slate-500 hover:text-slate-800">
                                    &larr; Back to form
                                </button>
                                <h4 className="text-sm font-semibold text-slate-900">Search Voter</h4>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    autoFocus
                                    className="ns-input pl-9"
                                    placeholder="Search by Name, Mobile or EPIC..."
                                    value={nameFilter}
                                    onChange={e => setNameFilter(e.target.value)}
                                />
                            </div>

                            {/* Search Results */}
                            <div className="max-h-48 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-sm">
                                {isSearching ? (
                                    <div className="p-4 text-center text-slate-500 text-sm">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {searchResults.map(voter => (
                                            <button
                                                key={voter.id}
                                                onClick={() => handleSelectVoter(voter)}
                                                className="w-full text-left p-3 hover:bg-slate-50 flex justify-between items-center group"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {language === 'mr' ? (voter.name_marathi || voter.name_english) : (voter.name_english || voter.name)}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {voter.age}Y • {voter.gender} • {voter.epicNo}
                                                    </p>
                                                </div>
                                                <PlusCircle className="w-4 h-4 text-brand-600 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                ) : nameFilter ? (
                                    <div className="p-4 text-center text-slate-500 text-sm">No voters found</div>
                                ) : (
                                    <div className="p-4 text-center text-slate-400 text-xs">Type to search...</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Main Form */}
                    <form id="scheme-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Applicant Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    required
                                    type="text"
                                    value={applicantName}
                                    onChange={e => setApplicantName(e.target.value)}
                                    className="ns-input pl-9"
                                    placeholder="Full Name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="tel"
                                    value={mobile}
                                    onChange={e => setMobile(e.target.value)}
                                    className="ns-input pl-9"
                                    placeholder="+91..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <textarea
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="ns-input pl-9 min-h-[80px]"
                                    placeholder="Current Address"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Documents Submitted</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="ns-input min-h-[80px]"
                                placeholder="Any additional details..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Benefit</label>
                            <textarea
                                value={benefit}
                                onChange={e => setBenefit(e.target.value)}
                                className="ns-input min-h-[80px]"
                                placeholder="Details about benefit provided..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason</label>
                            <textarea
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                className="ns-input min-h-[80px]"
                                placeholder="If rejected, provide reason..."
                            />
                        </div>

                        {selectedVoterId && (
                            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                                <CheckCircle className="w-4 h-4" />
                                <span>Linked to Voter ID: {selectedVoterId}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedVoterId(null);
                                        setApplicantName('');
                                        setMobile('');
                                        setAddress('');
                                        toast.info('Unlinked voter');
                                    }}
                                    className="ml-auto text-xs underline"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="scheme-form"
                        disabled={isSubmitting}
                        className="ns-btn-primary px-6"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                            </>
                        ) : (
                            'Submit Application'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SchemeApplicationModal;
