import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { type Staff } from '../../types/staff';
import { Plus, Trash2, Edit2, User, Phone, Briefcase, Tag } from 'lucide-react';

const StaffList = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        role: '',
        keywords: ''
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStaff(data || []);
        } catch (err) {
            console.error('Error fetching staff:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k);

            if (formData.mobile.length !== 10) {
                alert('Please enter a valid 10-digit mobile number');
                return;
            }
            const fullMobile = `+91${formData.mobile}`;

            const { error } = await supabase
                .from('staff')
                .insert([{
                    name: formData.name,
                    mobile: fullMobile,
                    role: formData.role,
                    keywords: keywordsArray
                }]);

            if (error) throw error;

            setShowModal(false);
            setFormData({ name: '', mobile: '', role: '', keywords: '' });
            fetchStaff();
            alert('Staff member added successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to add staff.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this staff member?')) return;
        try {
            const { error } = await supabase.from('staff').delete().eq('id', id);
            if (error) throw error;
            fetchStaff();
        } catch (err) {
            console.error(err);
            alert('Failed to delete staff.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-sm text-gray-500">Manage your team and auto-assignment rules</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700"
                >
                    <Plus className="w-4 h-4" /> Add Staff
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Add New Team Member</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text" required
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Ramesh Patil"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                                <div className="flex mt-1">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        required
                                        maxLength={10}
                                        className="w-full border rounded-r-lg p-2"
                                        value={formData.mobile}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, ''); // Only numbers
                                            setFormData({ ...formData, mobile: val });
                                        }}
                                        placeholder="9876543210"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <input
                                    type="text"
                                    list="roles"
                                    required
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    placeholder="e.g. Electrician, Supervisor"
                                />
                                <datalist id="roles">
                                    <option value="Electrician" />
                                    <option value="Plumber" />
                                    <option value="Sanitation" />
                                    <option value="Road Works" />
                                    <option value="Helper" />
                                    <option value="Civil Engineer" />
                                    <option value="Supervisor" />
                                </datalist>
                                <p className="text-xs text-gray-500 mt-1">Select from list or type a new role</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Auto-Assign Keywords</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={formData.keywords}
                                    onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                    placeholder="e.g. light, pole, current (comma separated)"
                                />
                                <p className="text-xs text-gray-500 mt-1">Complaints containing these words will be auto-assigned to this person.</p>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save Staff</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>)}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.map((member) => (
                        <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-brand-50 p-2 rounded-full text-brand-600">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{member.name}</h3>
                                        <div className="flex items-center text-xs text-gray-500 gap-1">
                                            <Briefcase className="w-3 h-3" />
                                            {member.role}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(member.id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-2 mt-4 pt-3 border-t border-gray-100">
                                <div className="flex items-center text-sm text-gray-600 gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {member.mobile}
                                </div>
                                <div className="flex items-start text-sm text-gray-600 gap-2">
                                    <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex flex-wrap gap-1">
                                        {member.keywords && member.keywords.length > 0 ? (
                                            member.keywords.map((k, i) => (
                                                <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                                                    {k}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 italic text-xs">No keywords set</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {staff.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">No staff members found. Add your team to start auto-assignment.</div>}
                </div>
            )}
        </div>
    );
};

export default StaffList;
