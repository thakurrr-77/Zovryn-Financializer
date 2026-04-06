import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Lock, User, LayoutDashboard, AlertCircle, ArrowRight } from 'lucide-react';
import { useUser } from '../hooks/useUser';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { refreshUser } = useUser();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            localStorage.setItem('token', response.data.access_token);
            await refreshUser(); // Update global context immediately
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid username or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5 pointers-none"></div>
            
            <div className="w-full max-w-md p-10 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative z-10 transition-all hover:border-slate-700 duration-500">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-slate-900 border-4 border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/10">
                        <LayoutDashboard size={40} className="text-indigo-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 font-sans">Welcome Back</h1>
                    <p className="text-slate-400 text-sm">Secure access to Financializer</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 ml-1">Username</label>
                        <div className="relative flex items-center">
                            <User size={18} className="absolute left-4 text-slate-500" />
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border-2 border-slate-800 rounded-xl text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 focus:shadow-indigo-500/5 focus:shadow-lg"
                                placeholder="e.g. admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
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
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border-2 border-slate-800 rounded-xl text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 focus:shadow-indigo-500/5 focus:shadow-lg"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm animate-pulse">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-semibold text-lg transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group"
                    >
                        {loading ? 'Authenticating...' : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 flex flex-col items-center gap-3 text-sm">
                    <p className="text-slate-400">
                        Don't have an account? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Join us</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
