import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  PackageOpen,
  Loader2,
  Plus,
  Eye,
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import TransferMaterialModal from '../../components/TransferMaterialModal';

interface StockTransfer {
  id: number;
  transfer_no: string;
  from_location: string;
  to_location: string;
  date: string;
  status: string;
  requested_by: number;
  requestedBy?: {
    name: string;
  };
  items: TransferItem[];
}

interface TransferItem {
  id: number;
  material_id: number;
  quantity: number;
  unit_id: number;
  material: {
    name: string;
  };
  unit: {
    name: string;
  };
}

const StockTransferPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/stock-transfers');
      setTransfers(response.data);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSuccess = () => {
    setShowTransferModal(false);
    fetchTransfers();
  };

  const getLocationLabel = (location: string) => {
    const labels: { [key: string]: string } = {
      grn_store: 'GRN Store',
      hot_kitchen: 'Kitchen Store',
      beverage: 'Beverage Store',
      pastry: 'Pastry Store',
      bakery: 'Bakery Store',
    };
    return labels[location] || location;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
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
              <div className="p-2 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg shadow-md shadow-violet-500/20">
                <PackageOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Stock Transfer</h1>
                <p className="text-xs text-slate-500">Transfer materials between stores</p>
              </div>
            </div>
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-violet-500 to-violet-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Transfer Material
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Store View Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { key: 'hot_kitchen', label: 'Kitchen Store', color: 'from-red-500 to-red-600', icon: '🔥' },
            { key: 'beverage', label: 'Beverage Store', color: 'from-blue-500 to-blue-600', icon: '🍹' },
            { key: 'pastry', label: 'Pastry Store', color: 'from-pink-500 to-pink-600', icon: '🧁' },
            { key: 'bakery', label: 'Bakery Store', color: 'from-amber-500 to-amber-600', icon: '🥖' },
          ].map((store) => (
            <button
              key={store.key}
              onClick={() => navigate(`/stock-transfer/store/${store.key}`)}
              className={`bg-white rounded-xl shadow-md border border-slate-200 p-4 hover:shadow-lg transition-all duration-200 group`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-gradient-to-br ${store.color} rounded-lg shadow-md text-white text-xl`}>
                    {store.icon}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{store.label}</span>
                </div>
                <Eye className="w-4 h-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>

        {/* Transfer History */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-800">Transfer History</h2>
            <p className="text-xs text-slate-500 mt-1">Recent material transfers</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <PackageOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">No transfers yet</p>
              <p className="text-slate-400 text-xs mt-1">Click "Transfer Material" to create your first transfer</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-slate-800">{transfer.transfer_no}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                          {transfer.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(transfer.date).toLocaleDateString()}
                        </div>
                        {transfer.requestedBy && (
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {transfer.requestedBy.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm mb-3">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                      {getLocationLabel(transfer.from_location)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                      {getLocationLabel(transfer.to_location)}
                    </span>
                  </div>

                  {transfer.items && transfer.items.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Materials:</span>{' '}
                        {transfer.items.map((item, idx) => (
                          <span key={item.id}>
                            {item.material.name} ({item.quantity} {item.unit.name})
                            {idx < transfer.items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Transfer Material Modal */}
      {showTransferModal && (
        <TransferMaterialModal
          onClose={() => setShowTransferModal(false)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
};

export default StockTransferPage;
