import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Search, Edit2, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreateMaterial from './CreateMaterial';
import EditMaterial from './EditMaterial';
import DeleteMaterial from './DeleteMaterial';

interface Material {
    id: number;
    code: string;
    name: string;
    category: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function MaterialPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const getDashboardPath = () => {
        return '/dashboard';
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const response = await fetch('/api/materials', {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });
            
            if (!response.ok) return;
            
            const data = await response.json();
            if (data.success) {
                setMaterials(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMaterials = materials.filter(material =>
        material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (material.category && material.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleEditClick = (material: Material) => {
        setEditingMaterial(material);
        setIsEditModalOpen(true);
    };

    const handleDeleteSuccess = () => {
        setDeleteConfirmId(null);
        fetchMaterials();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(getDashboardPath())}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="p-2 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl shadow-lg shadow-sky-500/25">
                                <Layers className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    Material
                                </h1>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2">
                            <span className="px-3 py-1.5 text-sm font-medium text-sky-600 bg-sky-100 rounded-lg">
                                Materials
                            </span>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Title & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Materials</h2>
                        <p className="text-slate-500 mt-1">Manage your shop materials and inventory</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 hover:from-sky-600 hover:to-sky-700 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        Add Material
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, code, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Materials Table */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                        </div>
                    ) : filteredMaterials.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="p-4 bg-slate-100 rounded-full mb-4">
                                <Layers className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                {searchQuery ? 'No materials found' : 'No materials yet'}
                            </h3>
                            <p className="text-slate-500 text-center max-w-sm">
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Get started by adding your first material'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-sky-600 uppercase tracking-wider">
                                            Code
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-sky-600 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-sky-600 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-sky-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredMaterials.map((material, index) => (
                                        <tr
                                            key={material.id}
                                            className="hover:bg-sky-50/50 transition-colors duration-150"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-medium text-slate-700">{material.code}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-semibold shadow-md">
                                                        {material.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{material.name}</p>
                                                        {!material.is_active && (
                                                            <span className="text-xs text-red-500">Inactive</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {material.category ? (
                                                    <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                                                        {material.category}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(material)}
                                                        className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-100 rounded-lg transition-all duration-200"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {deleteConfirmId === material.id ? (
                                                        <DeleteMaterial
                                                            material={material}
                                                            onSuccess={handleDeleteSuccess}
                                                            onCancel={() => setDeleteConfirmId(null)}
                                                        />
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteConfirmId(material.id)}
                                                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200"
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

                    {/* Footer with count */}
                    {!loading && filteredMaterials.length > 0 && (
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                            <p className="text-sm text-slate-500">
                                Showing <span className="font-semibold text-slate-700">{filteredMaterials.length}</span>{' '}
                                of <span className="font-semibold text-slate-700">{materials.length}</span> materials
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <CreateMaterial
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => fetchMaterials()}
            />

            <EditMaterial
                isOpen={isEditModalOpen}
                material={editingMaterial}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingMaterial(null);
                }}
                onSuccess={() => fetchMaterials()}
            />
        </div>
    );
}
