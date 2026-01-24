import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Users, Clock, Save, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface Visitor {
    id: string;
    name: string;
    mobile: string;
    purpose: string;
    remarks: string;
    visit_date: string;
    status: string;
}

const VisitorLog = () => {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        purpose: 'Complaint', // Default
        remarks: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVisitors();
    }, []);

    const fetchVisitors = async () => {
        // Fetch today's visitors or last 50
        const { data, error } = await supabase
            .from('visitors')
            .select('*')
            .order('visit_date', { ascending: false })
            .limit(50);

        if (data) setVisitors(data);
        setLoading(false);
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('visitors')
                .insert([{
                    name: formData.name,
                    mobile: formData.mobile,
                    purpose: formData.purpose,
                    remarks: formData.remarks,
                    visit_date: new Date().toISOString()
                }]);

            if (error) throw error;

            setFormData({ name: '', mobile: '', purpose: 'Complaint', remarks: '' });
            fetchVisitors();
            alert('Visitor Checked In ✅');
        } catch (err) {
            console.error(err);
            alert('Error logging visitor');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-8 h-8 text-brand-600" /> Office Visitor Log
            </h1>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Check-in Form */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-500" /> New Entry
                        </h2>
                        <form onSubmit={handleCheckIn} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Visitor Name</label>
                                <input
                                    type="text" required
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Full Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    placeholder="Contact Number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Purpose</label>
                                <select
                                    className="w-full border rounded-lg p-2 mt-1"
                                    value={formData.purpose}
                                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                                >
                                    <option value="Complaint">Complaint</option>
                                    <option value="Meeting">Meeting with Saheb</option>
                                    <option value="Greeting">Greeting / Invitation</option>
                                    <option value="Donation">Donation / Help</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                                <textarea
                                    className="w-full border rounded-lg p-2 mt-1 h-20"
                                    value={formData.remarks}
                                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                    placeholder="Optional notes..."
                                />
                            </div>
                            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg font-medium hover:bg-brand-700 flex justify-center items-center gap-2">
                                <Save className="w-4 h-4" /> Check In
                            </button>
                        </form>
                    </div>
                </div>

                {/* Log List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Recent Visitors</h3>
                            <span className="text-sm text-gray-500">{format(new Date(), 'PP')}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {loading ? <div className="p-8 text-center">Loading...</div> : visitors.map(v => (
                                <div key={v.id} className="p-4 hover:bg-gray-50 transition flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{v.name}</h4>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-xs uppercase font-semibold">{v.purpose}</span>
                                            {v.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {v.mobile}</span>}
                                        </div>
                                        {v.remarks && <p className="text-gray-600 text-sm mt-2 italic">"{v.remarks}"</p>}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">{format(new Date(v.visit_date), 'h:mm a')}</div>
                                        <div className="text-xs text-gray-400">Visited</div>
                                    </div>
                                </div>
                            ))}
                            {visitors.length === 0 && !loading && (
                                <div className="p-8 text-center text-gray-500">
                                    No visitors logged today.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitorLog;
