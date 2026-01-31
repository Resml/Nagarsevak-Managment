import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';
import { MockService } from '../../services/mockData';

const JoinParty = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        mobile: '+91 ',
        age: '',
        address: '',
        area: '',
        isVoter: false,
        voterId: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            isVoter: e.target.checked
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        MockService.addSadasya({
            name: formData.name,
            mobile: formData.mobile,
            age: parseInt(formData.age) || 0,
            address: formData.address,
            area: formData.area,
            isVoter: formData.isVoter,
            voterId: formData.isVoter ? formData.voterId : undefined
        });

        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full ns-card p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration successful</h2>
                    <p className="text-slate-600 mb-6">
                        Thank you for joining our party as a Sadasya. We will keep you updated with our latest activities.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="ns-btn-primary w-full justify-center py-3"
                    >
                        Go to Login
                    </button>
                    <button
                        onClick={() => {
                            setIsSubmitted(false);
                            setFormData({
                                name: '',
                                mobile: '+91 ',
                                age: '',
                                address: '',
                                area: '',
                                isVoter: false,
                                voterId: ''
                            });
                        }}
                        className="mt-3 text-brand-700 font-semibold hover:underline block w-full"
                    >
                        Register Another Member
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="ns-card p-6 md:p-8 relative">
                    <button
                        onClick={() => navigate('/login')}
                        className="absolute top-4 left-4 ns-btn-ghost px-2 py-2 border border-slate-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="text-center mb-6">
                        <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black shadow-sm">
                            N
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-slate-900">Join as Sadasya</h2>
                        <p className="mt-1 text-sm text-slate-500">Submit details for registration</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="ns-input"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                                Mobile Number
                            </label>
                            <div className="mt-1">
                                <input
                                    id="mobile"
                                    name="mobile"
                                    type="tel"
                                    required
                                    className="ns-input"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    placeholder="+91 "
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                                    Age
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="age"
                                        name="age"
                                        type="number"
                                        min="18"
                                        required
                                        className="ns-input"
                                        value={formData.age}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                                Area / Colony
                            </label>
                            <div className="mt-1">
                                <input
                                    id="area"
                                    name="area"
                                    type="text"
                                    className="ns-input"
                                    value={formData.area || ''}
                                    onChange={handleChange}
                                    placeholder="e.g. Ganesh Nagar"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Full Address
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="address"
                                    name="address"
                                    rows={3}
                                    required
                                    className="ns-input"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="isVoter"
                                name="isVoter"
                                type="checkbox"
                                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                                checked={formData.isVoter}
                                onChange={handleCheckboxChange}
                            />
                            <label htmlFor="isVoter" className="ml-2 block text-sm text-gray-900">
                                I am a registered Voter in this ward
                            </label>
                        </div>

                        {formData.isVoter && (
                            <div>
                                <label htmlFor="voterId" className="block text-sm font-medium text-gray-700">
                                    Voter ID (EPIC No)
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="voterId"
                                        name="voterId"
                                        type="text"
                                        className="ns-input"
                                        value={formData.voterId}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="ns-btn-primary w-full justify-center py-3"
                            >
                                <UserPlus className="w-5 h-5 mr-2" />
                                Join Party
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JoinParty;
