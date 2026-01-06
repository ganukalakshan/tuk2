import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Store,
  Loader2,
  Package,
  Filter,
  CheckCircle2
} from 'lucide-react';
import axios from 'axios';

interface StoreMaterial {
  id: number;
  material_name: string;
  quantity: number;
  unit: string;
  material_id: number | null;
  store: string;
  transferred_from_grn: boolean;
}

const StoreView: React.FC = () => {
  const navigate = useNavigate();
  const { store } = useParams<{ store: string }>();
  
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<StoreMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<StoreMaterial[]>([]);
  const [showGrnOnly, setShowGrnOnly] = useState(false);

  const storeLabels: { [key: string]: { label: string; color: string; icon: string } } = {
    hot_kitchen: { label: 'Kitchen Store', color: 'from-red-500 to-orange-600', icon: '🔥' },
    beverage: { label: 'Beverage Store', color: 'from-blue-500 to-cyan-600', icon: '🍹' },
    pastry: { label: 'Pastry Store', color: 'from-pink-500 to-rose-600', icon: '🧁' },
    bakery: { label: 'Bakery Store', color: 'from-amber-500 to-yellow-600', icon: '🥖' },
  };

  const currentStore = store ? storeLabels[store] : null;

  useEffect(() => {
    if (store) {
      fetchStoreMaterials();
    }
  }, [store]);

  useEffect(() => {
    if (showGrnOnly) {
      setFilteredMaterials(materials.filter(m => m.transferred_from_grn));
    } else {
      setFilteredMaterials(materials);
    }
  }, [showGrnOnly, materials]);

  const fetchStoreMaterials = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/stock-transfers/store/${store}/materials`);
      setMaterials(response.data);
      setFilteredMaterials(response.data);
    } catch (error) {
      console.error('Error fetching store materials:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-zinc-900 to-stone-800 p-6 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl">Store not found</p>
          <button
            onClick={() => navigate('/stock-transfer')}
            className="mt-4 px-6 py-2 bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Back to Stock Transfer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/stock-transfer')}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                title="Back to Stock Transfer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className={`p-2 bg-gradient-to-br ${currentStore.color} rounded-lg shadow-md text-xl`}>
                {currentStore.icon}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">{currentStore.label}</h1>
                <p className="text-xs text-slate-500">
                  {filteredMaterials.length} materials
                  {showGrnOnly && ' • GRN Transferred Only'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGrnOnly(!showGrnOnly)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                showGrnOnly
                  ? 'bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-md shadow-violet-500/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              {showGrnOnly ? 'Showing GRN Only' : 'Show All'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md shadow-indigo-500/20">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-slate-500 text-xs font-medium mb-1">Total Materials</h3>
            <p className="text-2xl font-bold text-slate-800">{materials.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md shadow-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-slate-500 text-xs font-medium mb-1">From GRN Store</h3>
            <p className="text-2xl font-bold text-green-600">
              {materials.filter(m => m.transferred_from_grn).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md shadow-blue-500/20">
                <Store className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-slate-500 text-xs font-medium mb-1">Other Sources</h3>
            <p className="text-2xl font-bold text-blue-600">
              {materials.filter(m => !m.transferred_from_grn).length}
            </p>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-800">Materials Inventory</h2>
            <p className="text-xs text-slate-500 mt-1">Available materials in this store</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">
                {showGrnOnly
                  ? 'No materials transferred from GRN Store yet'
                  : 'No materials in this store yet'}
              </p>
              <p className="text-slate-400 text-xs mt-1">Materials will appear here after transfer</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-md hover:border-violet-200 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-800 mb-1">{material.material_name}</h3>
                      {material.transferred_from_grn && (
                        <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          From GRN
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Available</div>
                      <div className="text-2xl font-bold text-violet-600">
                        {material.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                        {material.unit}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StoreView;
