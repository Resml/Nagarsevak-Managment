import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Users } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        const success = await login(email);
        if (success) {
            navigate('/');
        } else {
            setError('Invalid email. Try admin@ns.com');
        }
    };

    const quickLogin = (email: string) => {
        setEmail(email);
        login(email).then((success) => {
            if (success) navigate('/');
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-brand-700">Nagar Sevak</h1>
                    <p className="text-gray-500 mt-2">Management Automation Platform</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                            placeholder="user@example.com"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-brand-600 text-white py-2 px-4 rounded-md hover:bg-brand-700 transition-colors"
                    >
                        Login
                    </button>
                </form>

                <div className="mt-8">
                    <p className="text-xs text-center text-gray-400 mb-4">DEMO LOGIN OPTIONS</p>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => quickLogin('admin@ns.com')}
                            className="flex flex-col items-center justify-center p-2 border rounded hover:bg-gray-50 text-xs"
                        >
                            <Shield className="w-5 h-5 text-purple-600 mb-1" />
                            <span>Admin</span>
                        </button>
                        <button
                            onClick={() => quickLogin('staff@ns.com')}
                            className="flex flex-col items-center justify-center p-2 border rounded hover:bg-gray-50 text-xs"
                        >
                            <Users className="w-5 h-5 text-blue-600 mb-1" />
                            <span>Staff</span>
                        </button>
                        <button
                            onClick={() => quickLogin('voter@ns.com')}
                            className="flex flex-col items-center justify-center p-2 border rounded hover:bg-gray-50 text-xs"
                        >
                            <User className="w-5 h-5 text-green-600 mb-1" />
                            <span>Citizen</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
