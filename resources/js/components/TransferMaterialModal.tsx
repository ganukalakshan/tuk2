import React, { useState, useEffect } from 'react';
import { X, Loader2, PackageOpen, ArrowRight } from 'lucide-react';
import axios from 'axios';

interface Material {
  material_id: number;
  material_name: string;
  available_quantity: number;
  unit_id: number;
  unit_name: string;
}

interface TransferMaterialModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const TransferMaterialModal: React.FC<TransferMaterialModalProps> = ({ onClose, onSuccess }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [toStore, setToStore] = useState<string>('');
  const [error, setError] = useState<string>('');

  const stores = [
    { value: 'hot_kitchen', label: 'Kitchen Store' },
    { value: 'beverage', label: 'Beverage Store' },
    { value: 'pastry', label: 'Pastry Store' },
    { value: 'bakery', label: 'Bakery Store' },
  ];

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/stock-transfers/available-materials');
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setError('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialSelect = (material: Material) => {
    setSelectedMaterial(material);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMaterial || !quantity || !toStore) {
      setError('Please fill all fields');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (quantityNum > selectedMaterial.available_quantity) {
      setError(`Quantity exceeds available stock (${selectedMaterial.available_quantity} ${selectedMaterial.unit_name})`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await axios.post('/api/stock-transfers/transfer', {
        material_id: selectedMaterial.material_id,
        quantity: quantityNum,
        unit_id: selectedMaterial.unit_id,
        to_store: toStore,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error transferring material:', error);
      setError(error.response?.data?.error || 'Failed to transfer material');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PackageOpen className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Transfer Material</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Material Selection */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-800 mb-3">Select Material from GRN Store</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                <PackageOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">No materials available in GRN Store</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
                {materials.map((material) => (
                  <button
                    key={material.material_id}
                    onClick={() => handleMaterialSelect(material)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      selectedMaterial?.material_id === material.material_id
                        ? 'bg-violet-50 border-2 border-violet-500 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-semibold text-slate-800 text-sm mb-1">{material.material_name}</div>
                    <div className="text-xs text-slate-500">
                      Available: <span className="text-violet-600 font-semibold">
                        {material.available_quantity} {material.unit_name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Transfer Form */}
          {selectedMaterial && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Selected Material:</span>
                  <span className="text-slate-800 font-semibold">{selectedMaterial.material_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Available Quantity:</span>
                  <span className="text-violet-600 font-semibold">
                    {selectedMaterial.available_quantity} {selectedMaterial.unit_name}
                  </span>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity to Transfer <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    max={selectedMaterial.available_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Enter quantity"
                    required
                  />
                  <span className="text-slate-600 px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium">
                    {selectedMaterial.unit_name}
                  </span>
                </div>
              </div>

              {/* Destination Store */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Transfer To <span className="text-red-500">*</span>
                </label>
                <select
                  value={toStore}
                  onChange={(e) => setToStore(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  required
                >
                  <option value="">Select destination store</option>
                  {stores.map((store) => (
                    <option key={store.value} value={store.value}>
                      {store.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transfer Summary */}
              {toStore && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg font-medium">
                        GRN Store
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-medium">
                        {stores.find(s => s.value === toStore)?.label}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedMaterial || !quantity || !toStore}
                  className="px-6 py-2 bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-lg hover:shadow-lg hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center font-medium"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Transferring...
                    </>
                  ) : (
                    'Transfer Material'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferMaterialModal;
