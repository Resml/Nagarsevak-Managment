import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { MockService } from '../../services/mockData';
import { type ComplaintType } from '../../types';
import { ArrowLeft, Camera, X, Sparkles, AlertTriangle } from 'lucide-react';
import { AIAnalysisService } from '../../services/aiService';

const ComplaintForm = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Pre-fill if coming from Voter Profile
    const prefillVoterId = location.state?.voterId || '';
    const prefillVoterName = location.state?.voterName || '';

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ComplaintType>('Other');
    const [ward, setWard] = useState('12'); // Default to 12 for MVP
    const [area, setArea] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);

    // AI States
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiValidation, setAiValidation] = useState<string | null>(null);
    const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');

    // Smart AI Auto-Categorization & Urgency
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (title.length > 5 || description.length > 10) {
                setIsAnalyzing(true);
                // Use the first photo as context if available (assuming it's a base64 or blob we can read)
                // Note: For MVP blob URLs aren't easily readable back to base64 without fetch, 
                // so we'll just analyze text for now unless a real file handler is added.
                const result = await AIAnalysisService.analyzeComplaint(title, description); // Image omitted for MVP speed

                if (result.category && result.category !== 'Other') {
                    setType(result.category as ComplaintType);
                }
                setUrgency(result.urgency);
                setIsAnalyzing(false);
            }
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timer);
    }, [title, description]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { error } = await supabase.from('complaints').insert([{
                problem: title + '\n' + description, // Combine for schema compatibility or change schema models if needed. Current schema seems to use 'problem'.
                category: type,
                status: 'Pending',
                priority: urgency, // Add priority/urgency to DB insert if schema supports it, strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly
                location: 'Ward ' + ward,
                area: area,
                source: 'Website',
                // For MVP, we don't have logged in voter ID linkage easily unless auth context is fully used.
                // leaving user_id null or anonymous.
            }]);

            if (error) throw error;
            navigate(-1);
        } catch (err) {
            console.error('Error submitting complaint:', err);
            alert('Failed to submit complaint');
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // Create a fake local URL for MVP
            const url = URL.createObjectURL(e.target.files[0]);
            setPhotos([...photos, url]);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-brand-600 mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-brand-50 p-6 border-b border-brand-100">
                    <h1 className="text-xl font-bold text-gray-900">New Complaint</h1>
                    {prefillVoterName && (
                        <p className="text-sm text-brand-700 mt-1">
                            Linking to Voter: <span className="font-semibold">{prefillVoterName}</span>
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
                        <input
                            required
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-2 px-3 border"
                            placeholder="e.g. Garbage not collected"
                        />
                        {isAnalyzing && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-brand-600 animate-pulse">
                                <Sparkles className="w-3 h-3" />
                                <span>AI is analyzing issue details...</span>
                            </div>
                        )}
                        {urgency === 'High' && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-red-600 font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                <span>High Urgency Detected by AI</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as ComplaintType)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-3 px-3 border"
                            >
                                <option value="Cleaning">Cleaning / Garbage</option>
                                <option value="Water">Water Supply</option>
                                <option value="Road">Road / Potholes</option>
                                <option value="Drainage">Drainage</option>
                                <option value="StreetLight">Street Light</option>
                                <option value="SelfIdentified">Self-Identified (Observed)</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ward Number</label>
                            <select
                                value={ward}
                                onChange={(e) => setWard(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-3 px-3 border"
                            >
                                <option value="12">Ward 12</option>
                                <option value="13">Ward 13</option>
                                <option value="14">Ward 14</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Area / Colony Name</label>
                            <input
                                type="text"
                                value={area}
                                onChange={(e) => setArea(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-2 px-3 border"
                                placeholder="e.g. Ganesh Nagar, Lane 3"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description & Location Details</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-2 px-3 border"
                            placeholder="Describe the issue in detail..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
                        <div className="flex flex-wrap gap-4">
                            {photos.map((photo, index) => (
                                <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                                    <img src={photo} alt="evidence" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-brand-400 transition-colors">
                                <Camera className="w-6 h-6 text-gray-400 mb-1" />
                                <span className="text-xs text-gray-500">Add Photo</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm font-medium"
                        >
                            Submit Complaint
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ComplaintForm;
