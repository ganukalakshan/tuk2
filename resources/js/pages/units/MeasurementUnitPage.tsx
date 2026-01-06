import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, Edit2, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreateMeasurementUnit from './CreateMeasurementUnit';
import EditMeasurementUnit from './EditMeasurementUnit';
import DeleteMeasurementUnit from './DeleteMeasurementUnit';

interface MeasurementUnit {
    id: number;
    unit_name: string;
    unit_symbol: string;
    is_base: boolean;
    conversion_to_base: string;
    created_at: string;
    updated_at: string;
}

export default function MeasurementUnitPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [units, setUnits] = useState<MeasurementUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<MeasurementUnit | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Determine back navigation based on user role
    const getDashboardPath = () => {
        return '/dashboard';
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        try {
            const response = await fetch('/api/measurement-units', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('API Error:', response.status);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setUnits(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch measurement units:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUnits = units.filter(unit =>
        unit.unit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.unit_symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateSuccess = () => {
        fetchUnits();
    };

    const handleEditClick = (unit: MeasurementUnit) => {
        setEditingUnit(unit);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        fetchUnits();
    };

    const handleDeleteSuccess = () => {
        setDeleteConfirmId(null);
        fetchUnits();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    Measurement Unit
                                </h1>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2">
                            <span className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg">
                                Units
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
                        <h2 className="text-3xl font-bold text-slate-800">Measurement Units</h2>
                        <p className="text-slate-500 mt-1">Manage your measurement units</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        Add Unit
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or symbol..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Units Table */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : filteredUnits.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="p-4 bg-slate-100 rounded-full mb-4">
                                <Package className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                {searchQuery ? 'No units found' : 'No units yet'}
                            </h3>
                            <p className="text-slate-500 text-center max-w-sm">
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Get started by adding your first measurement unit'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                            Symbol
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                            Base Unit
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                            Conversion
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUnits.map((unit) => (
                                        <tr
                                            key={unit.id}
                                            className="hover:bg-slate-50/50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-bold text-blue-600">
                                                            {unit.unit_name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="font-semibold text-slate-800">{unit.unit_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {unit.unit_symbol}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        unit.is_base
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {unit.is_base ? 'Base' : 'Derived'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {unit.is_base ? '—' : unit.conversion_to_base}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {deleteConfirmId === unit.id ? (
                                                        <DeleteMeasurementUnit
                                                            unit={unit}
                                                            onSuccess={handleDeleteSuccess}
                                                            onCancel={() => setDeleteConfirmId(null)}
                                                        />
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditClick(unit)}
                                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                                title="Edit Unit"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirmId(unit.id)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                                title="Delete Unit"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Stats Footer */}
                <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                    <p>
                        Showing {filteredUnits.length} of {units.length} units
                    </p>
                    <p>
                        {units.filter(u => u.is_base).length} base units
                    </p>
                </div>
            </main>

            {/* Create Modal */}
            <CreateMeasurementUnit
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            {/* Edit Modal */}
            <EditMeasurementUnit
                isOpen={isEditModalOpen}
                unit={editingUnit}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingUnit(null);
                }}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
}
