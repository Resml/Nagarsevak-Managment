import { useState, useEffect, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Search, User, Loader2, PlusCircle, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import type { Voter } from '../../types';

interface IncomingLetterUploadProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const IncomingLetterUpload = ({ onClose, onSuccess, initialData }: IncomingLetterUploadProps) => {
    const { t, language } = useLanguage();
    const { tenantId } = useTenant();
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [area, setArea] = useState(initialData?.area || '');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(initialData?.scanned_file_url || null);
    const [uploading, setUploading] = useState(false);

    // Bearer Details State
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [mobile, setMobile] = useState('');

    // Voter Search Modal State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<Voter[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Advanced Search State
    const [nameFilter, setNameFilter] = useState('');
    const [houseNoFilter, setHouseNoFilter] = useState('');
    const [ageFilter, setAgeFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [addressFilter, setAddressFilter] = useState('');

    // Suggestions State
    const [houseNoSuggestions, setHouseNoSuggestions] = useState<{ house_no: string; count: number }[]>([]);
    const [showHouseNoSuggestions, setShowHouseNoSuggestions] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState<{ address: string; count: number }[]>([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

    const houseNoWrapperRef = useRef<HTMLDivElement>(null);
    const addressWrapperRef = useRef<HTMLDivElement>(null);

    // Fetch Stats for Suggestions (copied logic from ComplaintForm for consistency)
    useEffect(() => {
        if (!isSearchOpen) return;
        const fetchStats = async () => {
            try {
                const { data: votersData } = await supabase
                    .from('voters')
                    .select('address_english, address_marathi, house_no')
                    .eq('tenant_id', tenantId)
                    .limit(1000);

                if (votersData) {
                    const addrs = new Map<string, number>();
                    const houses = new Map<string, number>();

                    votersData.forEach(v => {
                        const addr = language === 'mr' ? (v.address_marathi || v.address_english) : v.address_english;
                        if (addr) addrs.set(addr, (addrs.get(addr) || 0) + 1);

                        if (v.house_no) houses.set(v.house_no, (houses.get(v.house_no) || 0) + 1);
                    });

                    setAddressSuggestions(Array.from(addrs).map(([address, count]) => ({ address, count })).sort((a, b) => b.count - a.count).slice(0, 50));
                    setHouseNoSuggestions(Array.from(houses).map(([house_no, count]) => ({ house_no, count })).sort((a, b) => b.count - a.count).slice(0, 50));
                }
            } catch (err) {
                console.error('Error fetching suggestions:', err);
            }
        };
        fetchStats();
    }, [isSearchOpen, language, tenantId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addressWrapperRef.current && !addressWrapperRef.current.contains(event.target as Node)) {
                setShowAddressSuggestions(false);
            }
            if (houseNoWrapperRef.current && !houseNoWrapperRef.current.contains(event.target as Node)) {
                setShowHouseNoSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredHouseNos = houseNoSuggestions.filter(item =>
        item.house_no.toLowerCase().includes(houseNoFilter.toLowerCase())
    ).slice(0, 50);

    const filteredAddresses = addressSuggestions.filter(item =>
        item.address.toLowerCase().includes(addressFilter.toLowerCase())
    ).slice(0, 50);

    // Search Effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!isSearchOpen) return;
            setIsSearching(true);
            try {
                let query = supabase
                    .from('voters')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .limit(20);

                if (nameFilter) {
                    if (/^\d+$/.test(nameFilter)) {
                        query = query.ilike('mobile', `%${nameFilter}%`);
                    } else {
                        query = query.or(`name_english.ilike.%${nameFilter}%,name_marathi.ilike.%${nameFilter}%,epic_no.ilike.%${nameFilter}%`);
                    }
                }

                if (addressFilter) {
                    query = query.or(`address_english.ilike.%${addressFilter}%,address_marathi.ilike.%${addressFilter}%`);
                }

                if (houseNoFilter) {
                    query = query.ilike('house_no', `%${houseNoFilter}%`);
                }

                if (ageFilter) {
                    if (ageFilter.includes('-')) {
                        const [minAge, maxAge] = ageFilter.split('-').map(a => parseInt(a.trim()));
                        if (!isNaN(minAge) && !isNaN(maxAge)) {
                            query = query.gte('age', minAge).lte('age', maxAge);
                        }
                    } else {
                        const age = parseInt(ageFilter);
                        if (!isNaN(age)) {
                            query = query.eq('age', age);
                        }
                    }
                }

                if (genderFilter) {
                    query = query.eq('gender', genderFilter);
                }

                const { data, error } = await query;
                if (error) throw error;

                const mappedVoters: Voter[] = (data || []).map((row: any) => ({
                    id: row.id.toString(),
                    name: row.name_english || row.name_marathi,
                    name_english: row.name_english,
                    name_marathi: row.name_marathi,
                    age: row.age,
                    gender: row.gender,
                    address: row.address_english || row.address_marathi,
                    address_english: row.address_english,
                    address_marathi: row.address_marathi,
                    ward: row.ward_no || '-',
                    booth: row.part_no?.toString() || '-',
                    epicNo: row.epic_no,
                    mobile: row.mobile,
                    houseNo: row.house_no,
                    history: []
                }));

                setSearchResults(mappedVoters);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [nameFilter, houseNoFilter, ageFilter, genderFilter, addressFilter, isSearchOpen, tenantId]);


    const handleVoterSelect = (voter: Voter) => {
        const fullName = language === 'mr' ? (voter.name_marathi || voter.name_english || '') : (voter.name_english || voter.name_marathi || '');
        const parts = fullName.trim().split(/\s+/);

        let f = '', m = '', l = '';
        if (parts.length > 0) f = parts[0];
        if (parts.length === 2) l = parts[1];
        if (parts.length >= 3) {
            m = parts[1];
            l = parts.slice(2).join(' ');
        }

        setFirstName(f);
        setMiddleName(m);
        setLastName(l);

        if (voter.mobile) {
            setMobile(voter.mobile.startsWith('+91') ? voter.mobile : `+91 ${voter.mobile}`);
        } else {
            setMobile('+91 ');
        }

        // Also set area if available
        const voterAddress = language === 'mr' ? (voter.address_marathi || voter.address_english) : voter.address_english;
        if (voterAddress) {
            setArea(voterAddress);
        }

        setIsSearchOpen(false);
        toast.success(`Linked voter: ${fullName}`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(selectedFile.type)) {
            toast.error('Please upload a PDF or image file (JPG, PNG)');
            return;
        }

        // Validate file size (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setFile(selectedFile);

        // Generate preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null); // No preview for PDFs
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || (!file && !initialData)) {
            toast.error('Please provide a title and select a file');
            return;
        }

        setUploading(true);

        try {
            let publicUrl = initialData?.scanned_file_url;
            let fileType = initialData?.file_type;

            // 1. Upload file to Supabase Storage if new file selected
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `incoming_letters/${Date.now()}_${title.replace(/\s+/g, '_').toLowerCase()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, file, {
                        contentType: file.type
                    });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('documents')
                    .getPublicUrl(fileName);

                publicUrl = data.publicUrl;
                fileType = file.type;
            }

            // 3. Prepare Description with Bearer Details
            let finalDescription = description;
            const bearerName = `${firstName} ${middleName} ${lastName}`.trim().replace(/\s+/g, ' ');

            if (bearerName || mobile) {
                finalDescription += `\n\n--- ${t('letters.bearer_details')} ---\n`;
                if (bearerName) finalDescription += `${t('letters.name')}: ${bearerName}\n`;
                if (mobile) finalDescription += `${t('letters.mobile')}: ${mobile}`;
            }

            // 4. Upsert data
            const payload: any = {
                title,
                description: finalDescription,
                area: area || null,
                scanned_file_url: publicUrl,
                file_type: fileType,
                tenant_id: tenantId
            };

            let error;
            if (initialData) {
                const { error: updateError } = await supabase
                    .from('incoming_letters')
                    .update(payload)
                    .eq('id', initialData.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('incoming_letters')
                    .insert(payload);
                error = insertError;
            }


            if (error) throw error;

            toast.success(t('letters.upload_incoming') + ' ' + t('complaints.status.resolved')); // "Upload Incoming Letter Resolved" - bit weird but indicates success. 
            // Better to just say "Success"
            toast.success('Letter uploaded successfully!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Failed to upload letter');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Upload className="w-6 h-6 text-brand-600" />
                            {initialData ? t('letters.edit_incoming') || 'Edit Incoming Letter' : t('letters.upload_incoming')}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {t('letters.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {t('letters.scan_file')} {initialData ? '' : '*'}
                        </label>
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-brand-400 transition">
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center gap-3"
                            >
                                {file ? (
                                    <>
                                        {preview ? (
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="max-h-48 rounded-lg border border-slate-200"
                                            />
                                        ) : (
                                            <FileText className="w-16 h-16 text-brand-600" />
                                        )}
                                        <div className="text-sm">
                                            <p className="font-semibold text-slate-700">{file.name}</p>
                                            <p className="text-slate-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setFile(null);
                                                setPreview(null);
                                            }}
                                            className="text-sm text-red-600 hover:text-red-700"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-12 h-12 text-slate-400" />
                                        <div>
                                            <p className="font-semibold text-slate-700">
                                                {t('gallery.click_upload')}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                PDF, JPG, PNG (Max 10MB)
                                            </p>
                                        </div>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {t('letters.incoming_title')} *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('letters.incoming_title')}
                            className="ns-input w-full"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            {t('letters.description')}
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('letters.desc_placeholder')} // "Details about the event..." generic enough
                            className="ns-input w-full h-24"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Area */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('letters.area')}
                            </label>
                            <input
                                type="text"
                                value={area}
                                onChange={(e) => setArea(e.target.value)}
                                placeholder={t('letters.search_area_placeholder')}
                                className="ns-input w-full"
                            />
                        </div>
                        {/* Mobile */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('letters.mobile')}
                            </label>
                            <input
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="ns-input w-full"
                            />
                        </div>
                    </div>

                    {/* Bearer Section */}
                    <div className="border-t border-slate-200 pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-semibold text-slate-700">
                                {t('letters.bearer_details')}
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(true)}
                                className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 transition-colors"
                            >
                                <Search className="w-3.5 h-3.5" />
                                {t('complaints.form.search_voter') || "Find from Voter List"}
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder={t('letters.first_name')}
                                    className="ns-input w-full"
                                    disabled={!!initialData}
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={middleName}
                                    onChange={(e) => setMiddleName(e.target.value)}
                                    placeholder={t('letters.middle_name')}
                                    className="ns-input w-full"
                                    disabled={!!initialData}
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder={t('letters.last_name')}
                                    className="ns-input w-full"
                                    disabled={!!initialData}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="ns-btn-ghost flex-1"
                            disabled={uploading}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="ns-btn-primary flex-1"
                            disabled={uploading || !title || (!file && !initialData)}
                        >
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin">⏳</span>
                                    {t('common.loading')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    {initialData ? t('common.save_changes') : t('letters.upload_incoming')}
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Voter Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center p-5 border-b border-slate-200/70 bg-white">
                            <h3 className="text-lg font-bold text-slate-900">{t('complaints.form.search_voter') || "Search Voter"}</h3>
                            <button onClick={() => setIsSearchOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 bg-slate-50 border-b border-slate-200/70 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder={t('sadasya.search_name_placeholder') || "Search by Name"}
                                    className="ns-input"
                                    autoFocus
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                />
                                <div className="relative" ref={houseNoWrapperRef}>
                                    <input
                                        type="text"
                                        placeholder={t('sadasya.search_house_no') || "Search House No"}
                                        className="ns-input"
                                        value={houseNoFilter}
                                        onFocus={() => setShowHouseNoSuggestions(true)}
                                        onChange={(e) => {
                                            setHouseNoFilter(e.target.value);
                                            setShowHouseNoSuggestions(true);
                                        }}
                                    />
                                    {showHouseNoSuggestions && filteredHouseNos.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                                            {filteredHouseNos.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between"
                                                    onClick={() => {
                                                        setHouseNoFilter(item.house_no);
                                                        setShowHouseNoSuggestions(false);
                                                    }}
                                                    type="button"
                                                >
                                                    <span>{item.house_no}</span>
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-1 rounded">{item.count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder={t('sadasya.age_range_placeholder') || "Age / Range (e.g. 18-24)"}
                                    className="ns-input"
                                    value={ageFilter}
                                    onChange={(e) => setAgeFilter(e.target.value)}
                                />
                                <select
                                    className="ns-input"
                                    value={genderFilter}
                                    onChange={(e) => setGenderFilter(e.target.value)}
                                >
                                    <option value="">{t('sadasya.all_genders') || "All Genders"}</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Other</option>
                                </select>
                            </div>
                            <div>
                                <div className="relative" ref={addressWrapperRef}>
                                    <input
                                        type="text"
                                        placeholder={t('sadasya.search_address') || "Search Address"}
                                        className="ns-input w-full"
                                        value={addressFilter}
                                        onFocus={() => setShowAddressSuggestions(true)}
                                        onChange={(e) => {
                                            setAddressFilter(e.target.value);
                                            setShowAddressSuggestions(true);
                                        }}
                                    />
                                    {showAddressSuggestions && filteredAddresses.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                                            {filteredAddresses.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between"
                                                    onClick={() => {
                                                        setAddressFilter(item.address);
                                                        setShowAddressSuggestions(false);
                                                    }}
                                                    type="button"
                                                >
                                                    <span className="truncate mr-2">{item.address}</span>
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-1 rounded whitespace-nowrap">{item.count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-white min-h-[300px]">
                            {isSearching ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-500" />
                                    <span className="text-sm font-medium">Searching voters...</span>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {searchResults.map(voter => (
                                        <div
                                            key={voter.id}
                                            onClick={() => handleVoterSelect(voter)}
                                            className="p-4 hover:bg-slate-50 cursor-pointer transition-colors group flex justify-between items-center"
                                        >
                                            <div className="flex-1 pr-4">
                                                <p className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors text-base">
                                                    {language === 'mr' ? (voter.name_marathi || voter.name_english) : voter.name_english}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                                        {voter.age} Y • {voter.gender}
                                                    </span>
                                                    <span className="text-slate-300">|</span>
                                                    <span>EPIC: <span className="font-medium text-slate-700">{voter.epicNo}</span></span>
                                                    {voter.mobile && (
                                                        <>
                                                            <span className="text-slate-300">|</span>
                                                            <div className="flex items-center gap-1 text-slate-600">
                                                                <Phone className="w-3 h-3" />
                                                                {voter.mobile}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1.5 line-clamp-1 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></span>
                                                    {language === 'mr' ? (voter.address_marathi || voter.address_english) : voter.address_english}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                <PlusCircle className="w-5 h-5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (nameFilter || houseNoFilter || ageFilter || genderFilter || addressFilter) ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="font-medium text-slate-900">No voters found</p>
                                    <p className="text-sm mt-1 text-slate-400">Try adjusting your search filters</p>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                    <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-brand-300" />
                                    </div>
                                    <p className="font-medium text-slate-700">Search for a voter</p>
                                    <p className="text-sm mt-1 text-slate-400 max-w-xs text-center">Enter search criteria to find voters in the list</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomingLetterUpload;
