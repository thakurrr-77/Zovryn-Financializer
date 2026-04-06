import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
    LayoutDashboard, 
    LogOut, 
    TrendingUp, 
    Users,
    Shield,
    CheckCircle,
    XCircle,
    UserCircle,
    ArrowLeft,
    Wallet,
    ChevronDown,
    Search,
    ShieldCheck,
    Settings,
    MoreHorizontal,
    PieChart
} from 'lucide-react';
import { useUser, User as UserType } from '../hooks/useUser';

interface Role {
    id: number;
    name: string;
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserType[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { isAdmin, isAnalyst, user: currentUser } = useUser();
    const navigate = useNavigate();

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users/'),
                api.get('/roles/')
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (err) {
            console.error('Failed to fetch user management data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin === false) {
            navigate('/');
        } else if (isAdmin === true) {
            fetchAllData();
        }
    }, [isAdmin]);

    const toggleStatus = async (user: UserType) => {
        try {
            await api.put(`/users/${user.id}/status`, { is_active: !user.is_active });
            fetchAllData();
        } catch (err) {
            console.error('Status toggle failed', err);
        }
    };

    const assignRole = async (userId: number, roleId: number) => {
        try {
            await api.post(`/users/${userId}/roles/${roleId}`);
            fetchAllData();
        } catch (err) {
            console.error('Role assignment failed', err);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

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
                    <div className={`flex items-center justify-center py-2 px-3 rounded-xl border text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all ${
                        isAdmin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]' :
                        isAnalyst ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]' :
                        'bg-slate-800/80 text-slate-400 border-slate-700 shadow-inner'
                    }`}>
                        <span className="hidden lg:inline">{isAdmin ? '🛡️ Admin' : isAnalyst ? '📈 Analyst' : '👁️ Viewer'}</span>
                        <span className="lg:hidden text-lg">{isAdmin ? '🛡️' : isAnalyst ? '📈' : '👁️'}</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-1.5">
                    <Link to="/" className="flex items-center gap-3 px-3 lg:px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                        <LayoutDashboard size={20} /> <span className="hidden lg:block">Dashboard</span>
                    </Link>
                    {isAnalyst && (
                        <Link to="/records" className="flex items-center gap-3 px-3 lg:px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                            <TrendingUp size={20} className="group-hover:translate-y--0.5 transition-transform" /> <span className="hidden lg:block">Transaction Records</span>
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin/users" className="flex items-center gap-3 px-3 lg:px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-medium transition-all group">
                            <Users size={20} className="group-hover:scale-110 transition-transform" /> <span className="hidden lg:block">Assign Roles</span>
                        </Link>
                    )}
                    {isAnalyst && (
                        <Link to="/reports" className="flex items-center gap-3 px-3 lg:px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                            <PieChart size={20} className="group-hover:rotate-12 transition-transform" /> <span className="hidden lg:block">Insights</span>
                        </Link>
                    )}
                    <Link to="/profile" className="flex items-center gap-3 px-3 lg:px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                        <UserCircle size={20} className="group-hover:scale-110 transition-transform" /> <span className="hidden lg:block">My Profile</span>
                    </Link>
                </nav>
                <div className="mt-auto space-y-2">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-3 lg:px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                        <LogOut size={20} /> <span className="hidden lg:block">Log Out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-4 lg:p-10 max-w-7xl mx-auto w-full relative">
                {/* Ambient Role Glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] pointer-events-none opacity-10 blur-[150px] transition-colors duration-1000 rounded-b-full ${
                    isAdmin ? 'bg-emerald-500' : isAnalyst ? 'bg-amber-500' : 'bg-slate-500'
                }`}></div>

                <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 relative z-10">
                    <div>
                        <Link to="/" className="text-slate-500 hover:text-indigo-400 flex items-center gap-1 text-sm mb-1 transition-colors">
                            <ArrowLeft size={14} /> System Registry
                        </Link>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Access Control</h2>
                        <p className="text-slate-500 text-sm font-medium">Managing user profiles and security roles</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative group max-w-xs">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transtion-colors" />
                            <input 
                                className="bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm w-64 placeholder:text-slate-600 shadow-inner"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                {/* User Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center animate-pulse text-indigo-400 font-bold tracking-tighter">Retreiving System Personnel...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-500 font-bold bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">No personnel records found in this sector.</div>
                    ) : filteredUsers.map(u => (
                        <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-300">
                            {/* Card Background Glow */}
                            <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>

                            <div className="flex items-center gap-4 mb-6 relative">
                                <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${u.is_active ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400' : 'border-slate-800 bg-slate-950 text-slate-600'}`}>
                                    <UserCircle size={32} />
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${u.is_active ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' : 'bg-slate-700'}`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white truncate text-lg tracking-tight">{u.username} {u.id === currentUser?.id && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full ml-1 vertical-middle">YOU</span>}</h4>
                                    <p className="text-xs text-slate-500 truncate group-hover:text-slate-400 transition-colors">{u.email}</p>
                                </div>
                                <button className="p-2 text-slate-600 hover:text-white transition-colors"><MoreHorizontal size={20}/></button>
                            </div>

                            <div className="space-y-4 relative">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                                        <span>Authentication Status</span>
                                        <span className={u.is_active ? 'text-emerald-500' : 'text-slate-600'}>{u.is_active ? 'ENABLED' : 'DISABLED'}</span>
                                    </div>
                                    <button 
                                        onClick={() => toggleStatus(u)}
                                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border-2 ${u.is_active ? 'border-red-500/20 text-red-500 hover:bg-red-500/10' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}`}
                                    >
                                        {u.is_active ? <XCircle size={14}/> : <CheckCircle size={14}/>}
                                        {u.is_active ? 'Disable Access' : 'Enable Access'}
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Authorization Clearance</label>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {u.roles.map(r => (
                                            <span key={r.id} className="px-2.5 py-1 bg-slate-950 text-indigo-400 text-[10px] font-bold rounded-lg border border-slate-800 flex items-center gap-1 shadow-sm">
                                                <Shield size={10} /> {r.name}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="relative group/select">
                                        <select 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                            onChange={(e) => assignRole(u.id, parseInt(e.target.value))}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Grant Clearance Level...</option>
                                            {roles.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none group-hover/select:text-indigo-400 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default UserManagement;
