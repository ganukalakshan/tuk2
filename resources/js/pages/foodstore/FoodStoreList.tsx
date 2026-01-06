import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, ArrowLeft, Package, Calendar, DollarSign, Hash, User, Clock, Loader2, RefreshCw, Trash2 } from 'lucide-react';

interface FoodStoreRecord {
  id: number;
  menu_item_id: number;
  user_id: number;
  quantity: number;
  expiry_date: string;
  cost: number;
  created_at: string;
  menu_item?: {
    id: number;
    name: string;
    price?: number;
  };
  user?: {
    id: number;
    name: string;
  };
}

const FoodStoreList: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<FoodStoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wastageLoading, setWastageLoading] = useState<number | null>(null);
  const [showWastageModal, setShowWastageModal] = useState<FoodStoreRecord | null>(null);
  const [wastageReason, setWastageReason] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/food-store-records');
      setRecords(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays >= 0;
  };

  const isExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const handleMoveToWastage = async () => {
    if (!showWastageModal) return;
    
    setWastageLoading(showWastageModal.id);
    try {
      await axios.post(`/api/food-store-records/${showWastageModal.id}/wastage`, {
        reason: wastageReason || 'Moved to wastage'
      });
      // Remove the record from the list
      setRecords(prev => prev.filter(r => r.id !== showWastageModal.id));
      setShowWastageModal(null);
      setWastageReason('');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to move to wastage');
    } finally {
      setWastageLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-yellow-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-white/80 border border-amber-200 rounded-full shadow hover:bg-amber-100 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-amber-700">Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-amber-700 tracking-tight">Food Store</h1>
              <p className="text-amber-600 text-sm">Manage your ready-made products</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecords}
              className="p-3 bg-white/80 border border-amber-200 rounded-xl shadow hover:bg-amber-100 transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-amber-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/food-store/add')}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Production
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
            <button
              onClick={fetchRecords}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && records.length === 0 && (
          <div className="bg-white/90 rounded-2xl shadow-xl border border-stone-200 p-12 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Productions Yet</h3>
            <p className="text-gray-500 mb-6">Start by adding your first food store production</p>
            <button
              onClick={() => navigate('/food-store/add')}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add First Production
            </button>
          </div>
        )}

        {/* Records Grid */}
        {!loading && !error && records.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden"
              >
                {/* Card Header */}
                <div className={`p-3 text-white relative ${
                  record.expiry_date && isExpired(record.expiry_date) 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : record.expiry_date && isExpiringSoon(record.expiry_date)
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}>
                  {/* Expired Label */}
                  {record.expiry_date && isExpired(record.expiry_date) && (
                    <div className="absolute top-1 right-1">
                      <div className="bg-white text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                        EXPIRED
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold truncate">
                        {record.menu_item?.name || `Product #${record.menu_item_id}`}
                      </h3>
                      <p className="text-white/80 text-xs">#{record.id}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-2">
                  {/* Quantity */}
                  <div className="flex items-center justify-between p-2 bg-amber-50 rounded-md">
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-amber-600" />
                      <span className="text-gray-600 text-xs">Qty</span>
                    </div>
                    <span className="text-sm font-bold text-amber-700">{record.quantity}</span>
                  </div>

                  {/* Expiry Date */}
                  {record.expiry_date && (
                    <div className={`flex items-center justify-between p-2 rounded-md ${
                      isExpired(record.expiry_date) 
                        ? 'bg-red-50' 
                        : isExpiringSoon(record.expiry_date)
                        ? 'bg-orange-50'
                        : 'bg-blue-50'
                    }`}>
                      <Calendar className={`w-3 h-3 ${
                        isExpired(record.expiry_date) 
                          ? 'text-red-600' 
                          : isExpiringSoon(record.expiry_date)
                          ? 'text-orange-600'
                          : 'text-blue-600'
                      }`} />
                      <span className={`text-xs font-bold ${
                        isExpired(record.expiry_date) 
                          ? 'text-red-700' 
                          : isExpiringSoon(record.expiry_date)
                          ? 'text-orange-700'
                          : 'text-blue-700'
                      }`}>
                        {formatDate(record.expiry_date)}
                      </span>
                    </div>
                  )}

                  {/* Created By */}
                  {record.user && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <User className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700 truncate">{record.user.name}</span>
                    </div>
                  )}

                  {/* Wastage Button */}
                  <button
                    onClick={() => setShowWastageModal(record)}
                    disabled={wastageLoading === record.id}
                    className="w-full mt-1 px-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-semibold rounded-md transition-all flex items-center justify-center gap-1 border border-red-200 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    {wastageLoading === record.id ? '...' : 'Wastage'}
                  </button>

                  {/* Created At */}
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatDateTime(record.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wastage Confirmation Modal */}
        {showWastageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Move to Wastage</h3>
                    <p className="text-white/80 text-sm">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium">
                    You are about to move the following product to wastage:
                  </p>
                  <div className="mt-3 space-y-2">
                    <p className="text-gray-700">
                      <span className="font-semibold">Product:</span> {showWastageModal.menu_item?.name || `Product #${showWastageModal.menu_item_id}`}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Quantity:</span> {showWastageModal.quantity}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Cost:</span> Rs. {Number(showWastageModal.cost || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Wastage (Optional)
                  </label>
                  <textarea
                    value={wastageReason}
                    onChange={(e) => setWastageReason(e.target.value)}
                    placeholder="e.g., Expired, Damaged, Quality issue..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowWastageModal(null);
                    setWastageReason('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMoveToWastage}
                  disabled={wastageLoading !== null}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {wastageLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Confirm Wastage
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodStoreList;
