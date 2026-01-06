import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreateCustomer from './CreateCustomer';
import EditCustomer from './EditCustomer';
import DeleteCustomer from './DeleteCustomer';

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function CustomerPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Determine back navigation based on user role
    const getDashboardPath = () => {
        return '/dashboard';
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            console.log('Fetching customers from /api/customers...');
            const response = await fetch('/api/customers', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                console.error('API Error:', response.status, response.statusText);
                const text = await response.text();
                console.error('Response body:', text);
                return;
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Not JSON response. Content-Type:', contentType);
                console.error('Response body:', text);
                return;
            }
            
            const data = await response.json();
            console.log('Customers data:', data);
            if (data.success) {
                setCustomers(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleCreateSuccess = () => {
        fetchCustomers();
    };

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        fetchCustomers();
    };

    const handleDeleteSuccess = () => {
        setDeleteConfirmId(null);
        fetchCustomers();
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
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/25">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    Customer
                                </h1>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2">
                            <span className="px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-100 rounded-lg">
                                Customers
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
                        <h2 className="text-3xl font-bold text-slate-800">Customers</h2>
                        <p className="text-slate-500 mt-1">Manage your customer database</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        Add Customer
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Customer Table */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="p-4 bg-slate-100 rounded-full mb-4">
                                <Users className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                {searchQuery ? 'No customers found' : 'No customers yet'}
                            </h3>
                            <p className="text-slate-500 text-center max-w-sm">
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Get started by adding your first customer'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-purple-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCustomers.map((customer, index) => (
                                        <tr
                                            key={customer.id}
                                            className="hover:bg-purple-50/50 transition-colors duration-150"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{customer.name}</p>
                                                        {customer.address && (
                                                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                                <MapPin className="w-3 h-3" />
                                                                {customer.address.length > 30
                                                                    ? customer.address.substring(0, 30) + '...'
                                                                    : customer.address}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                    {customer.phone}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {customer.email ? (
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Mail className="w-4 h-4 text-slate-400" />
                                                        <a
                                                            href={`mailto:${customer.email}`}
                                                            className="hover:text-purple-600 transition-colors"
                                                        >
                                                            {customer.email}
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(customer)}
                                                        className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-all duration-200"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {deleteConfirmId === customer.id ? (
                                                        <DeleteCustomer
                                                            customer={customer}
                                                            onSuccess={handleDeleteSuccess}
                                                            onCancel={() => setDeleteConfirmId(null)}
                                                        />
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteConfirmId(customer.id)}
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
                    {!loading && filteredCustomers.length > 0 && (
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                            <p className="text-sm text-slate-500">
                                Showing <span className="font-semibold text-slate-700">{filteredCustomers.length}</span>{' '}
                                of <span className="font-semibold text-slate-700">{customers.length}</span> customers
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <CreateCustomer
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            <EditCustomer
                isOpen={isEditModalOpen}
                customer={editingCustomer}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingCustomer(null);
                }}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
}
