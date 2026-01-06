import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Trash2, 
  Package, 
  Calendar, 
  DollarSign, 
  Hash, 
  User, 
  Clock, 
  Loader2, 
  RefreshCw,
  MapPin,
  FileText,
  AlertTriangle,
  Plus
} from 'lucide-react';

interface WastageRecord {
  id: number;
  material_id: number | null;
  menu_item_id: number | null;
  food_store_record_id: number | null;
  quantity: number;
  cost: number | null;
  unit_id: number | null;
  reason: string | null;
  location: string;
  recorded_by: number | null;
  date: string;
  created_at: string;
  material?: {
    id: number;
    name: string;
  };
  menu_item?: {
    id: number;
    name: string;
  };
  unit?: {
    id: number;
    name: string;
    symbol: string;
  };
  recorded_by_user?: {
    id: number;
    name: string;
  };
}

const WastagePage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<WastageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/wastage');
      setRecords(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load wastage records');
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

  const getLocationColor = (location: string) => {
    switch (location) {
      case 'store':
        return 'bg-blue-100 text-blue-700';
      case 'kitchen':
        return 'bg-orange-100 text-orange-700';
      case 'bar':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Only show product wastage records (menu_item_id is not null)
  const productRecords = records.filter(record => record.menu_item_id !== null);

  const totalWastageCost = productRecords.reduce((sum, r) => sum + Number(r.cost || 0), 0);
  const totalQuantity = productRecords.reduce((sum, r) => sum + Number(r.quantity || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-red-50 to-orange-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-white/80 border border-red-200 rounded-full shadow hover:bg-red-100 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-red-700">Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-red-700 tracking-tight">Wastage & Shortage</h1>
              <p className="text-red-600 text-sm">Track and manage wastage records</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecords}
              className="p-3 bg-white/80 border border-red-200 rounded-xl shadow hover:bg-red-100 transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-red-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/wastage/add')}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Wastage
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
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
        {!loading && !error && productRecords.length === 0 && (
          <div className="bg-white/90 rounded-2xl shadow-xl border border-stone-200 p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Wastage Records</h3>
            <p className="text-gray-500">No wastage has been recorded yet</p>
          </div>
        )}

        {/* Records Grid */}
        {!loading && !error && productRecords.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {productRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300"
              >
                {/* Card Header */}
                <div className="p-3 text-white bg-gradient-to-r from-red-500 to-red-600">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold truncate">
                        {record.menu_item?.name || 'Unknown Product'}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-2">
                  {/* Quantity */}
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-red-600" />
                      <span className="text-gray-600 text-xs">Qty</span>
                    </div>
                    <span className="text-sm font-bold text-red-700">
                      {record.quantity} {record.unit?.symbol || ''}
                    </span>
                  </div>

                  {/* Reason */}
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-1">
                      Reason: 
                  {record.reason && (
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-gray-700 truncate" title={record.reason}>{record.reason}</p>
                    </div>
                  )}
                  </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-bold text-blue-700">
                      {formatDate(record.date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WastagePage;
