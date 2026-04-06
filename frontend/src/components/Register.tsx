import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Lock, User, LayoutDashboard, AlertCircle, Mail, UserPlus } from 'lucide-react';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/users/', {
                username,
                email,
                password
            });
            // Successfully registered, redirect to login
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-[#0f172a] to-slate-900 w-full">
            <div className="w-full max-w-md p-10 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl shadow-2xl">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-slate-900 border-4 border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-indigo-500/10 shadow-lg">
                        <LayoutDashboard size={40} className="text-indigo-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 font-sans">Create Account</h1>
                    <p className="text-slate-400 text-sm">Join Financializer</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 ml-1">Username</label>
                        <div className="relative flex items-center">
                            <User size={18} className="absolute left-4 text-slate-500" />
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border-2 border-slate-800 rounded-xl text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 ml-1">Email</label>
                        <div className="relative flex items-center">
                            <Mail size={18} className="absolute left-4 text-slate-500" />
                            <input
                                type="email"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border-2 border-slate-800 rounded-xl text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 ml-1">Password</label>
                        <div className="relative flex items-center">
                            <Lock size={18} className="absolute left-4 text-slate-500" />
                            <input
                                type="password"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border-2 border-slate-800 rounded-xl text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-semibold text-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <UserPlus size={20} />
                                <span>Get Started</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 flex flex-col items-center gap-3 text-sm">
                    <p className="text-slate-400">
                        Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
