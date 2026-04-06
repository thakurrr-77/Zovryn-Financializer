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
    ChevronRight,
    Wallet,
    Edit3,
    Trash2,
    RefreshCw,
    X,
    Filter,
    ArrowLeft,
    Settings,
    MoreVertical,
    Users,
    UserCircle
} from 'lucide-react';
import { useUser } from '../hooks/useUser';

interface Record {
    id: number;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    description: string;
    is_deleted: boolean;
    owner_id: number;
}

const Transactions: React.FC = () => {
    const [records, setRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Record | null>(null);
    const [formData, setFormData] = useState({
        amount: 0,
        type: 'expense' as 'income' | 'expense',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        owner_id: null as number | null
    });
    const [allUsers, setAllUsers] = useState<any[]>([]);

    const { user, isAdmin, isAnalyst } = useUser();
    const navigate = useNavigate();

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const params: any = { skip: 0, limit: 100 };
            if (search) params.search = search;
            if (category) params.category = category;
            if (type) params.type = type;

            const response = await api.get('/records/', { params });
            setRecords(response.data);
        } catch (err) {
            console.error('Failed to fetch records', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        if (!isAdmin) return;
        try {
            const response = await api.get('/users/');
            setAllUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    useEffect(() => {
        if (user && !isAnalyst) {
            navigate('/');
            return;
        }
        fetchRecords();
        if (isAdmin) fetchUsers();
    }, [user, isAnalyst, search, category, type, isAdmin]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRecord) {
                await api.put(`/records/${editingRecord.id}`, formData);
            } else {
                await api.post('/records/', formData);
            }
            setIsModalOpen(false);
            setEditingRecord(null);
            fetchRecords();
        } catch (err) {
            console.error('Save failed', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Mark this record as deleted?')) return;
        try {
            await api.delete(`/records/${id}`);
            fetchRecords();
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    const handleRestore = async (id: number) => {
        try {
            await api.post(`/records/${id}/restore`);
            fetchRecords();
        } catch (err) {
            console.error('Restore failed', err);
        }
    };

    const openEditModal = (record: any) => {
        setEditingRecord(record);
        setFormData({
            amount: record.amount,
            type: record.type,
            category: record.category,
            description: record.description || '',
            date: record.date,
            owner_id: record.owner_id
        });
        setIsModalOpen(true);
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
                        <Link to="/records" className="flex items-center gap-3 px-3 lg:px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-medium transition-all group">
                            <TrendingUp size={20} className="group-hover:translate-y--0.5 transition-transform" /> <span className="hidden lg:block">Transaction Records</span>
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin/users" className="flex items-center gap-3 px-3 lg:px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
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
                <button onClick={logout} className="mt-auto flex items-center gap-3 px-3 lg:px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl self-center lg:self-stretch">
                   <LogOut size={20} /> <span className="hidden lg:block">Log Out</span>
                </button>
            </aside>

            <main className="flex-1 p-4 lg:p-10 max-w-7xl mx-auto w-full relative">
                {/* Ambient Role Glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] pointer-events-none opacity-10 blur-[150px] transition-colors duration-1000 rounded-b-full ${
                    isAdmin ? 'bg-emerald-500' : isAnalyst ? 'bg-amber-500' : 'bg-slate-500'
                }`}></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
                    <div>
                        <Link to="/" className="text-slate-500 hover:text-indigo-400 flex items-center gap-1 text-sm mb-1 transition-colors">
                            <ArrowLeft size={14} /> Back to Overview
                        </Link>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Record Ledger</h2>
                        <p className="text-slate-500 text-sm">Full chronological transaction history</p>
                    </div>
                    
                    {isAdmin && (
                        <button 
                            onClick={() => { setEditingRecord(null); setFormData({ amount: 0, type: 'expense', category: '', description: '', date: new Date().toISOString().split('T')[0], owner_id: null }); setIsModalOpen(true); }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all active:scale-95 font-semibold text-sm"
                        >
                            <Plus size={18}/> New Record
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-3xl mb-8 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[240px] relative flex items-center group">
                        <Search size={18} className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400" />
                        <input 
                            className="bg-slate-950 border-2 border-slate-800 rounded-xl pl-12 pr-4 py-2.5 w-full outline-none focus:border-indigo-500 transition-all text-sm"
                            placeholder="Search by description or category..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-slate-500" />
                        <select 
                            className="bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-sm text-slate-300"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="income">Incomes</option>
                            <option value="expense">Expenses</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50 text-slate-500 font-bold text-xs uppercase tracking-widest border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Transaction</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Personnel</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-20 text-center animate-pulse text-indigo-400">Loading your ledger...</td></tr>
                                ) : records.length === 0 ? (
                                    <tr><td colSpan={5} className="py-20 text-center text-slate-500">No records found. Reset filters?</td></tr>
                                ) : records.map(rec => (
                                    <tr key={rec.id} className="group hover:bg-slate-800/40 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">{rec.description || 'Global Sync'}</div>
                                            <div className="text-xs text-slate-500 font-medium">{rec.date}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${rec.type === 'income' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                {rec.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-700">
                                                    {allUsers.find(u => u.id === rec.owner_id)?.username?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <span className="text-xs font-medium text-slate-400">
                                                    {allUsers.find(u => u.id === rec.owner_id)?.username || `ID: ${rec.owner_id}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-slate-400">{rec.category}</span>
                                        </td>
                                        <td className={`px-6 py-5 text-right font-bold tabular-nums ${rec.type === 'income' ? 'text-emerald-500' : 'text-slate-300'}`}>
                                            {rec.type === 'income' ? '+' : '-'}${rec.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isAdmin && (
                                                    <>
                                                        <button onClick={() => openEditModal(rec)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Edit"><Edit3 size={18}/></button>
                                                        <button onClick={() => handleDelete(rec.id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={18}/></button>
                                                    </>
                                                )}
                                                {!isAdmin && <span className="text-[10px] text-slate-600 font-bold italic">READ-ONLY</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* CRUD Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden scale-in">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-white">{editingRecord ? 'Update Transaction' : 'Record New Entry'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-white"
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value as 'income' | 'expense'})}
                                    >
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                    </select>
                                </div>
                                {isAdmin && (
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assign to Personnel</label>
                                        <select 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-white"
                                            value={formData.owner_id || ''}
                                            onChange={(e) => setFormData({...formData, owner_id: e.target.value ? parseInt(e.target.value) : null})}
                                        >
                                            <option value="">Default (Me)</option>
                                            {allUsers.map(u => (
                                                <option key={u.id} value={u.id}>{u.username} ({u.roles.map((r:any)=>r.name).join(', ')})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount ($)</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-white"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                                <input 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-white"
                                    placeholder="e.g. Salary, Groceries, Cloud Services"
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                                <textarea 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-white resize-none h-24"
                                    placeholder="Additional context about this entry..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Execution Date</label>
                                <input 
                                    type="date"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-white"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    required
                                />
                            </div>

                            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold tracking-tight shadow-lg shadow-indigo-600/20 transition-all active:scale-95 mt-4">
                                {editingRecord ? 'Commit Changes' : 'Confirm Transaction'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
