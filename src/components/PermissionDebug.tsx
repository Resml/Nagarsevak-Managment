import React from 'react';
import { useAuth } from '../context/AuthContext';

const PermissionDebug = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-[9999] max-w-sm">
            <h3 className="font-bold border-b border-white/20 mb-2 pb-1">Debug: User Permissions</h3>
            <div className="space-y-1">
                <p><span className="text-gray-400">ID:</span> {user.id}</p>
                <p><span className="text-gray-400">Role:</span> {user.role}</p>
                <p><span className="text-gray-400">Permissions:</span></p>
                <pre className="bg-black/50 p-2 rounded mt-1 overflow-auto max-h-32">
                    {JSON.stringify(user.permissions, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default PermissionDebug;
