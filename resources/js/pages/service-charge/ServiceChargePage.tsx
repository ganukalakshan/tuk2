import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Percent,
  Check,
  X,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface ServiceChargeItem {
  id: number;
  name: string;
  percentage: number;
  is_active: boolean;
  description?: string;
}

const ServiceChargePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [serviceCharges, setServiceCharges] = useState<ServiceChargeItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCharge, setEditingCharge] = useState<ServiceChargeItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    percentage: '',
    description: '',
    is_active: false
  });

  // Fetch service charges from API
  useEffect(() => {
    fetchServiceCharges();
  }, []);

  const fetchServiceCharges = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/service-charges');
      setServiceCharges(response.data);
    } catch (error) {
      console.error('Error fetching service charges:', error);
      alert('Failed to load service charges');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingCharge(null);
    setFormData({
      name: '',
      percentage: '',
      description: '',
      is_active: false
    });
    setShowModal(true);
  };

  const handleEdit = (charge: ServiceChargeItem) => {
    setEditingCharge(charge);
    setFormData({
      name: charge.name,
      percentage: charge.percentage.toString(),
      description: charge.description || '',
      is_active: charge.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this service charge?')) {
      try {
        await axios.delete(`/api/service-charges/${id}`);
        await fetchServiceCharges();
      } catch (error) {
        console.error('Error deleting service charge:', error);
        alert('Failed to delete service charge');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.percentage) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingCharge) {
        // Update existing charge
        await axios.put(`/api/service-charges/${editingCharge.id}`, formData);
      } else {
        // Add new charge
        await axios.post('/api/service-charges', formData);
      }
      
      await fetchServiceCharges();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving service charge:', error);
      alert('Failed to save service charge');
    }
  };

  const toggleActive = async (id: number) => {
    try {
      await axios.post(`/api/service-charges/${id}/toggle-active`);
      await fetchServiceCharges();
    } catch (error) {
      console.error('Error toggling service charge:', error);
      alert('Failed to update service charge status');
    }
  };

  const activeCharge = serviceCharges.find(charge => charge.is_active);

  const getDashboardPath = () => {
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-50">
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
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg shadow-yellow-500/25">
                <Percent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Service Charge</h1>
                <p className="text-xs text-slate-500">Manage service charge rates</p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <span className="text-sm text-slate-600">{user?.name}</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Active Service Charge */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/25">
                <Percent className="w-6 h-6 text-white" />
              </div>
              {activeCharge && <Check className="w-5 h-5 text-green-500" />}
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Active Service Charge</h3>
            <p className="text-3xl font-bold text-slate-800">
              {activeCharge ? `${activeCharge.percentage}%` : 'None'}
            </p>
            <p className="text-slate-500 text-sm mt-2">
              {activeCharge ? activeCharge.name : 'No active charge'}
            </p>
          </div>

          {/* Total Configured Charges */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Total Charges</h3>
            <p className="text-3xl font-bold text-slate-800">{serviceCharges.length}</p>
            <p className="text-slate-500 text-sm mt-2">Configured options</p>
          </div>

          {/* Average Percentage */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/25">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Average Rate</h3>
            <p className="text-3xl font-bold text-slate-800">
              {serviceCharges.length > 0 
                ? `${(serviceCharges.reduce((acc, curr) => acc + curr.percentage, 0) / serviceCharges.length).toFixed(2)}%`
                : '0%'
              }
            </p>
            <p className="text-slate-500 text-sm mt-2">Across all charges</p>
          </div>
        </div>

        {/* Title & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Service Charge Options</h2>
            <p className="text-slate-500 mt-1">Configure and manage your service charge rates</p>
          </div>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-xl shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Add Service Charge
          </button>
        </div>

        {/* Service Charges Table */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
          ) : serviceCharges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="p-4 bg-slate-100 rounded-full mb-4">
                <Percent className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">
                No Service Charges Configured
              </h3>
              <p className="text-slate-500 text-center max-w-sm mb-6">
                Get started by adding your first service charge configuration
              </p>
              <button
                onClick={handleAddNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-xl shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                Add Service Charge
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-yellow-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-yellow-600 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-yellow-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-yellow-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-yellow-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serviceCharges.map((charge, index) => (
                    <tr 
                      key={charge.id}
                      className="hover:bg-yellow-50/50 transition-colors duration-150"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                            charge.is_active 
                              ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' 
                              : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'
                          }`}>
                            <Percent className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{charge.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-800">
                            {parseFloat(charge.percentage.toString()).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {charge.description || <span className="text-slate-400 italic">No description</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(charge.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                            charge.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {charge.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(charge)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(charge.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">
                {editingCharge ? 'Edit Service Charge' : 'Add New Service Charge'}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Configure service charge details
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl 
                           text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 
                           focus:ring-yellow-500/20 focus:border-yellow-500 transition-all duration-200"
                  placeholder="e.g., Standard Service Charge"
                />
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Percentage (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl 
                           text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 
                           focus:ring-yellow-500/20 focus:border-yellow-500 transition-all duration-200"
                  placeholder="10.00"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl 
                           text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 
                           focus:ring-yellow-500/20 focus:border-yellow-500 transition-all duration-200
                           resize-none"
                  rows={3}
                  placeholder="Brief description of this service charge"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Set as Active
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    Make this the active service charge
                  </p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${
                    formData.is_active ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    formData.is_active ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl
                         hover:bg-slate-200 transition-colors duration-200 font-medium
                         flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 
                         text-white rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 
                         transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {editingCharge ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceChargePage;
