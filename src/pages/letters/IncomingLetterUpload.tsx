import { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';

interface IncomingLetterUploadProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const IncomingLetterUpload = ({ onClose, onSuccess, initialData }: IncomingLetterUploadProps) => {
    const { t } = useLanguage();
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

    // If editing, extract bearer details from description if possible (simple heuristic)
    // This is optional and might be complex depending on how description is stored.
    // For now, we'll just leave bearer details empty on edit unless we parse them back.


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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                            {t('letters.bearer_details')}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder={t('letters.first_name')}
                                    className="ns-input w-full"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={middleName}
                                    onChange={(e) => setMiddleName(e.target.value)}
                                    placeholder={t('letters.middle_name')}
                                    className="ns-input w-full"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder={t('letters.last_name')}
                                    className="ns-input w-full"
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
        </div>
    );
};

export default IncomingLetterUpload;
