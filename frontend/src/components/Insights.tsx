import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
    LayoutDashboard, 
    LogOut, 
    TrendingUp, 
    Users, 
    PieChart, 
    Wallet,
    UserCircle,
    ArrowLeft,
    BarChart3,
    Activity
} from 'lucide-react';
import { useUser } from '../hooks/useUser';

const Insights: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isAdmin, isAnalyst, loading: userLoading } = useUser();

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const params = isAdmin ? { global_view: true } : {};
            const response = await api.get('/dashboard/summary', { params });
            setData(response.data);
        } catch (err) {
            console.error('Failed to fetch insights data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userLoading) {
            if (!isAnalyst) {
                navigate('/'); // Redirect viewers away from insights
                return;
            }
            fetchInsights();
        }
    }, [userLoading, isAnalyst]);

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans w-full">
            {/* Sidebar */}
            <aside className="w-16 lg:w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col p-4 lg:p-6 transition-all h-screen sticky top-0 z-20">
                <div className="flex items-center gap-3 px-2 mb-6 group cursor-pointer overflow-hidden">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
                        <Wallet size={22} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight hidden lg:block">Financializer</span>
                </div>

                {/* ROLE BADGE */}
                <div className="mb-8 px-1 lg:px-2 hidden md:block">
                    <div className={`flex items-center justify-center py-2 px-3 rounded-xl border text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all ${
                        isAdmin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        isAnalyst ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-slate-800/80 text-slate-400 border-slate-700'
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
                    {isAnalyst && (
                        <Link to="/reports" className="flex items-center gap-3 px-3 lg:px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-medium transition-all group">
                            <PieChart size={20} className="group-hover:rotate-12 transition-transform" /> <span className="hidden lg:block">Insights</span>
                        </Link>
                    )}
                    <Link to="/profile" className="flex items-center gap-3 px-3 lg:px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                        <UserCircle size={20} className="group-hover:scale-110 transition-transform" /> <span className="hidden lg:block">My Profile</span>
                    </Link>
                </nav>

                <button onClick={logout} className="mt-auto flex items-center gap-3 px-3 lg:px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl self-center lg:self-stretch transition-all group">
                   <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/> <span className="hidden lg:block">Log Out</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:p-10 p-4 max-w-7xl mx-auto w-full relative">
                {/* Ambient Role Glow */}
                <div className={`absolute top-0 right-1/4 w-[500px] h-[500px] pointer-events-none opacity-20 blur-[120px] transition-colors duration-1000 rounded-full ${
                    isAdmin ? 'bg-emerald-500' : isAnalyst ? 'bg-amber-500' : 'bg-slate-500'
                }`}></div>

                <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 relative z-10 border-b border-slate-800 pb-6">
                    <div>
                        <Link to="/" className="text-slate-500 hover:text-indigo-400 flex items-center gap-1 text-sm mb-2 transition-colors">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </Link>
                        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <BarChart3 className="text-indigo-500" /> Analytical Insights
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Deep dive into financial breakdown and metrics</p>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-indigo-400 gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-400/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <span className="animate-pulse font-medium">Crunching Numbers...</span>
                    </div>
                ) : (
                    <div className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Categories breakdown */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <PieChart className="text-amber-500" />
                                    <h3 className="text-xl font-bold text-white tracking-tight">Category Breakdown</h3>
                                </div>
                                <div className="space-y-4">
                                    {data?.category_totals?.length > 0 ? data.category_totals.map((cat: any, idx: number) => {
                                        const max = Math.max(...data.category_totals.map((c: any) => c.total));
                                        const percentage = Math.round((cat.total / max) * 100);
                                        return (
                                            <div key={idx} className="group">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-slate-300 group-hover:text-amber-400 transition-colors uppercase tracking-wider text-xs">{cat.category}</span>
                                                    <span className="font-bold text-slate-100 tabular-nums">${cat.total.toLocaleString()}</span>
                                                </div>
                                                <div className="w-full bg-slate-950 rounded-full h-2.5 shadow-inner overflow-hidden border border-slate-800">
                                                    <div 
                                                        className="bg-amber-500 h-2.5 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-1"
                                                        style={{ width: `${percentage}%` }}
                                                    >
                                                        <div className="w-1 h-1 bg-white rounded-full opacity-50"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }) : (
                                        <div className="text-slate-500 italic py-10 text-center">No categories recorded yet.</div>
                                    )}
                                </div>
                            </div>

                            {/* Monthly Trends */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <Activity className="text-emerald-500" />
                                    <h3 className="text-xl font-bold text-white tracking-tight">Monthly PnL Trends</h3>
                                </div>
                                <div className="space-y-6">
                                    {data?.monthly_trends?.length > 0 ? data.monthly_trends.map((trend: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                                            <h4 className="font-bold text-slate-300 text-sm tracking-widest uppercase mb-4">{trend.month}</h4>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-emerald-500/70 uppercase font-bold tracking-wider">Inflow</span>
                                                    </div>
                                                    <div className="text-emerald-400 font-bold tabular-nums text-lg">${trend.income.toLocaleString()}</div>
                                                </div>
                                                <div className="w-px h-10 bg-slate-800"></div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-red-500/70 uppercase font-bold tracking-wider">Outflow</span>
                                                    </div>
                                                    <div className="text-red-400 font-bold tabular-nums text-lg">${trend.expense.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-slate-500 italic py-10 text-center">No monthly trends recorded yet.</div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Insights;
