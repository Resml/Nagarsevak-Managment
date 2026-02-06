import React from 'react';
import { Megaphone } from 'lucide-react';

const PublicCommunication = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Public Communication</h1>
            <div className="ns-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <Megaphone className="w-10 h-10 text-slate-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Coming Soon</h2>
                    <p className="text-slate-500 max-w-sm mt-2">
                        This module will facilitate direct communication and announcements to the public.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicCommunication;
