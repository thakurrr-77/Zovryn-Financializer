import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    LogOut,
    TrendingUp,
    Users,
    Wallet,
    ArrowLeft,
    CheckCircle,
    UserCircle,
    Mail,
    Lock,
    Save
} from 'lucide-react';
import { useUser } from '../hooks/useUser';

const Profile: React.FC = () => {
    const { isAdmin, isAnalyst, user: currentUser } = useUser();
    const navigate = useNavigate();

    const [username, setUsername] = useState(currentUser?.username || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Since currentUser might load a bit later, update states when it arrives
    React.useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username);
            setEmail(currentUser.email);
        }
    }, [currentUser]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        setIsSaving(true);

        try {
            const token = localStorage.getItem('token');
            const payload: any = {};
            if (username !== currentUser?.username) payload.username = username;
            if (email !== currentUser?.email) payload.email = email;
            if (password) payload.password = password;

            if (Object.keys(payload).length === 0) {
                setMessage({ text: 'No changes made.', type: 'info' });
                setIsSaving(false);
                return;
            }

            const response = await fetch('http://localhost:8000/api/users/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setMessage({ text: 'Profile updated successfully!', type: 'success' });
                setPassword(''); // Clear password field
            } else {
                const data = await response.json();
                setMessage({ text: data.detail || 'Failed to update profile', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Network error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-200">
            {/* Simple Sidebar */}
            <aside className="w-16 lg:w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col p-4 lg:p-6 transition-all h-screen sticky top-0">
                <div className="flex items-center gap-3 px-2 mb-6 overflow-hidden">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Wallet size={22} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight hidden lg:block">Financializer</span>
                </div>

                {/* ROLE BADGE */}
                <div className="mb-8 px-1 lg:px-2 hidden md:block">
                    <div className={`flex items-center justify-center py-2 px-3 rounded-xl border text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all ${isAdmin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]' :
                            isAnalyst ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]' :
                                'bg-slate-800/80 text-slate-400 border-slate-700 shadow-inner'
                        }`}>
                        <span className="hidden lg:inline">{isAdmin ? '🛡️ Admin' : isAnalyst ? '📈 Analyst' : '👁️ Viewer'}</span>
                        <span className="lg:hidden text-lg">{isAdmin ? '🛡️' : isAnalyst ? '📈' : '👁️'}</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-1.5">
                    <Link to="/" className="flex items-center gap-3 px-3 lg:px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                        <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" /> <span className="hidden lg:block">Dashboard</span>
                    </Link>
                    {isAnalyst && (
                        <Link to="/records" className="flex items-center gap-3 px-3 lg:px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                            <TrendingUp size={20} className="group-hover:translate-y--0.5 transition-transform" /> <span className="hidden lg:block">Transaction Records</span>
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin/users" className="flex items-center gap-3 px-3 lg:px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                            <Users size={20} className="group-hover:scale-110 transition-transform" /> <span className="hidden lg:block">Assign Roles</span>
                        </Link>
                    )}
                    <Link to="/profile" className="flex items-center gap-3 px-3 lg:px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-medium transition-all group">
                        <UserCircle size={20} className="group-hover:scale-110 transition-transform" /> <span className="hidden lg:block">My Profile</span>
                    </Link>
                </nav>
                <button onClick={logout} className="mt-auto flex items-center gap-3 px-3 lg:px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                    <LogOut size={20} /> <span className="hidden lg:block">Sign Out</span>
                </button>
            </aside>

            <main className="flex-1 p-4 lg:p-10 max-w-4xl mx-auto w-full relative">
                {/* Ambient Role Glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] pointer-events-none opacity-10 blur-[150px] transition-colors duration-1000 rounded-b-full ${isAdmin ? 'bg-emerald-500' : isAnalyst ? 'bg-amber-500' : 'bg-slate-500'
                    }`}></div>

                <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 relative z-10">
                    <div>
                        <Link to="/" className="text-slate-500 hover:text-indigo-400 flex items-center gap-1 text-sm mb-1 transition-colors">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </Link>
                        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            Account Settings
                        </h2>
                        <p className="text-slate-500 mt-1">Manage your identity and authentication details.</p>
                    </div>
                </header>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-10 shadow-xl relative z-10">
                    <form onSubmit={handleSave} className="space-y-6">
                        {message.text && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    message.type === 'info' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                        'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                {message.type === 'success' && <CheckCircle size={18} />}
                                {message.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 ml-1">Username</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                                        <UserCircle size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                        placeholder="Your username"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 ml-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2 mt-4">
                                <label className="text-sm font-medium text-slate-400 ml-1">Change Password (leave blank to keep current)</label>
                                <div className="relative border-t border-slate-800 pt-6 mt-2">
                                    <div className="absolute inset-y-0 bottom-[-24px] left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                        placeholder="New secure password"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800 mt-8">
                            <h3 className="text-slate-300 font-medium mb-3">Your Role</h3>
                            <div className="flex flex-wrap gap-2">
                                {currentUser?.roles.map(role => (
                                    <span key={role.id} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-sm font-medium">
                                        {role.name}
                                    </span>
                                ))}
                                {currentUser?.roles.length === 0 && (
                                    <span className="text-slate-500 italic text-sm">No roles assigned. Access restricted.</span>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Save size={18} />
                                )}
                                Save Profile
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Profile;
