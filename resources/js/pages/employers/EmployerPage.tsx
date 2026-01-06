import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UserCog,
    Plus,
    Search,
    Mail,
    ShieldCheck,
    CalendarClock,
    Edit2,
    Trash2,
    Loader2,
    ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreateEmployer from './CreateEmployer';
import EditEmployer from './EditEmployer';
import DeleteEmployer from './DeleteEmployer';

interface Employer {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'cashier';
    created_at: string;
    updated_at: string;
}

export default function EmployerPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    useEffect(() => {
        fetchEmployers();
    }, []);

    const fetchEmployers = async () => {
        try {
            const response = await fetch('/api/employers', {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) {
                console.error('Failed to load employers', response.status, response.statusText);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setEmployers(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch employers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployers = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return employers.filter((employer) =>
            employer.name.toLowerCase().includes(query) ||
            employer.email.toLowerCase().includes(query) ||
            employer.role.toLowerCase().includes(query)
        );
    }, [employers, searchQuery]);

    const handleCreateSuccess = () => {
        fetchEmployers();
    };

    const handleEditClick = (employer: Employer) => {
        setEditingEmployer(employer);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        fetchEmployers();
    };

    const handleDeleteSuccess = () => {
        setDeleteConfirmId(null);
        fetchEmployers();
    };

    const roleColors: Record<Employer['role'], string> = {
        admin: 'bg-red-100 text-red-700',
        manager: 'bg-blue-100 text-blue-700',
        cashier: 'bg-emerald-100 text-emerald-700',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/25">
                                <UserCog className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    Employer
                                </h1>
                                <p className="text-slate-500 text-sm">Manage staff accounts and roles</p>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2">
                            <span className="px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-100 rounded-lg">
                                Admin only
                            </span>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Employers</h2>
                        <p className="text-slate-500 mt-1">Create and manage team accounts</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        Add Employer
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    ) : filteredEmployers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="p-4 bg-slate-100 rounded-full mb-4">
                                <UserCog className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                {searchQuery ? 'No employers found' : 'No employers yet'}
                            </h3>
                            <p className="text-slate-500 text-center max-w-sm">
                                {searchQuery ? 'Try adjusting your search query' : 'Add your first staff account to get started'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-emerald-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredEmployers.map((employer) => (
                                        <tr key={employer.id} className="hover:bg-emerald-50/50 transition-colors duration-150">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold shadow-md">
                                                        {employer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{employer.name}</p>
                                                        {user?.id === employer.id && (
                                                            <p className="text-xs text-emerald-600 font-semibold">(You)</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Mail className="w-4 h-4 text-slate-400" />
                                                    <span>{employer.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[employer.role]}`}>
                                                    {employer.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <CalendarClock className="w-4 h-4 text-slate-400" />
                                                    {new Date(employer.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(employer)}
                                                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all duration-200"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {deleteConfirmId === employer.id ? (
                                                        <DeleteEmployer
                                                            employer={employer}
                                                            onSuccess={handleDeleteSuccess}
                                                            onCancel={() => setDeleteConfirmId(null)}
                                                        />
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteConfirmId(employer.id)}
                                                            disabled={user?.id === employer.id}
                                                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && filteredEmployers.length > 0 && (
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
                            <span>
                                Showing <span className="font-semibold text-slate-800">{filteredEmployers.length}</span> of{' '}
                                <span className="font-semibold text-slate-800">{employers.length}</span> employers
                            </span>
                            <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                Admin control only
                            </span>
                        </div>
                    )}
                </div>
            </main>

            <CreateEmployer
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            <EditEmployer
                isOpen={isEditModalOpen}
                employer={editingEmployer}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingEmployer(null);
                }}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
}
