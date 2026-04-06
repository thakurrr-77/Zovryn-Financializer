import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
    LayoutDashboard,
    LogOut,
    TrendingUp,
    TrendingDown,
    PieChart,
    Plus,
    Search,
    ArrowUpRight,
    Bell,
    Settings,
    ChevronRight,
    Wallet,
    Users,
    UserCircle
} from 'lucide-react';
import { useUser } from '../hooks/useUser';

const Dashboard: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [globalView, setGlobalView] = useState(false);
    const navigate = useNavigate();
    const { isAdmin, isAnalyst, loading: userLoading } = useUser();

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const params = (isAdmin && globalView) ? { global_view: true } : {};
            const response = await api.get('/dashboard/summary', { params });
            setData(response.data);
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userLoading) {
            fetchDashboard();
        }
    }, [userLoading, globalView, isAdmin]);

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };



    return (
        <div className="flex min-h-screen bg-slate-950 font-sans w-full">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col p-6 hidden lg:flex fixed h-full z-10 transition-all">
                <div className="flex items-center gap-3 px-2 mb-6 group cursor-pointer transition-transform hover:translate-x-1">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <Wallet size={22} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">Financializer</span>
                </div>

                {/* ROLE BADGE */}
                <div className="mb-8 px-2">
                    <div className={`flex items-center justify-center py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${isAdmin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]' :
                            isAnalyst ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]' :
                                'bg-slate-800/80 text-slate-400 border-slate-700 shadow-inner'
                        }`}>
                        {isAdmin ? '🛡️ Admin' : isAnalyst ? '📈 Analyst' : '👁️ Viewer'}
                    </div>
                </div>

                <nav className="flex-1 space-y-1.5">
                    <Link to="/" className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-medium transition-all group">
                        <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" /> Dashboard
                    </Link>
                    {isAnalyst && (
                        <Link to="/records" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                            <TrendingUp size={20} className="group-hover:translate-y--0.5 transition-transform" /> Transaction Records
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                            <Users size={20} className="group-hover:scale-110 transition-transform" /> Assign Roles
                        </Link>
                    )}
                    {isAnalyst && (
                        <Link to="/reports" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                            <PieChart size={20} className="group-hover:rotate-12 transition-transform" /> Insights
                        </Link>
                    )}
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                        <UserCircle size={20} className="group-hover:scale-110 transition-transform" /> My Profile
                    </Link>
                </nav>

                <div className="pt-6 border-t border-slate-800">
                    <button onClick={logout} className="w-full flex items-center justify-between px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all group shadow-sm">
                        <div className="flex items-center gap-3">
                            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Log Out</span>
                        </div>
                        <ChevronRight size={16} className="opacity-50" />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 transition-all duration-300 relative">
                {/* Ambient Role Glow */}
                <div className={`absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-20 blur-[120px] transition-colors duration-1000 rounded-full ${isAdmin ? 'bg-emerald-500' : isAnalyst ? 'bg-amber-500' : 'bg-slate-500'
                    }`}></div>

                <header className="sticky top-0 z-30 p-6 flex justify-between items-center bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Main Hub</h2>
                        <p className="text-slate-500 text-sm">Monitoring your core financial assets</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAnalyst && (
                            <Link to="/records" className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl group focus-within:border-indigo-500 transition-all shadow-inner">
                                <Search size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <span className="text-slate-600 text-sm">Quick ledger probe...</span>
                            </Link>
                        )}
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer hover:border-slate-700 transition-all relative group">
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-950 group-hover:scale-125 transition-transform"></span>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => setGlobalView(!globalView)}
                                className={`hidden md:flex items-center gap-2 px-4 py-2 border rounded-xl transition-all ${globalView ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700'}`}
                            >
                                <span className="font-bold text-sm tracking-tight">{globalView ? 'Global View' : 'Personal View'}</span>
                            </button>
                        )}
                        {isAdmin && (
                            <Link to="/records" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/10 transition-all active:scale-95 group">
                                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> <span className="font-medium">Direct Entry</span>
                            </Link>
                        )}
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[70vh] text-indigo-400 gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-400/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <span className="animate-pulse font-medium">Synchronizing Financializer Hub...</span>
                    </div>
                ) : (
                    <div className="p-8 space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <div className="p-8 bg-indigo-600 rounded-3xl text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                                <div className="absolute top--10 right--10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
                                <h3 className="text-indigo-100 font-medium mb-1 opacity-80">Net Operating Balance</h3>
                                <div className="text-4xl font-bold tracking-tight mb-2">${data?.net_balance?.toLocaleString() || 0}</div>
                                <div className="text-sm text-indigo-100/60 font-medium flex items-center gap-1">Synchronized just now <ArrowUpRight size={14} className="opacity-50" /></div>
                            </div>

                            <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl transition-all hover:border-slate-700">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-slate-400 font-bold text-xs tracking-widest uppercase">Cumulative Income</h3>
                                    <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 shadow-sm">+12%</div>
                                </div>
                                <div className="text-3xl font-bold text-white tracking-tight">${data?.total_income?.toLocaleString() || 0}</div>
                            </div>

                            <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl transition-all hover:border-slate-700">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-slate-400 font-bold text-xs tracking-widest uppercase">Cumulative Expenses</h3>
                                    <div className="px-2.5 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 shadow-sm">-8%</div>
                                </div>
                                <div className="text-3xl font-bold text-white tracking-tight">${data?.total_expenses?.toLocaleString() || 0}</div>
                            </div>
                        </div>

                        {/* Content Section */}
                        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">Real-time Stream</h3>
                                    <p className="text-slate-500 text-sm font-medium">Monitoring the lastest 10 system entries</p>
                                </div>
                            {isAnalyst && (
                                <Link to="/records" className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-bold transition-colors group">
                                    View full ledger <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-slate-800 bg-slate-950/20">
                                        <tr>
                                            <th className="px-5 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest">Source</th>
                                            <th className="px-5 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest">Sector</th>
                                            <th className="px-5 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest text-right">Magnitude</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {(data?.recent_activity || []).map((rec: any) => (
                                            <tr key={rec.id} className="group hover:bg-slate-800/30 transition-all cursor-pointer">
                                                <td className="px-5 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${rec.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            {rec.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white text-sm">{rec.description || 'System Sync'}</div>
                                                            <div className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">{rec.date}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5">
                                                    <span className="px-3 py-1 bg-slate-950 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-800 shadow-inner uppercase tracking-wider group-hover:border-slate-700 transition-colors">{rec.category}</span>
                                                </td>
                                                <td className={`px-5 py-5 text-right font-bold text-lg tabular-nums tracking-tighter ${rec.type === 'income' ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                    {rec.type === 'income' ? '+' : '-'}${rec.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
