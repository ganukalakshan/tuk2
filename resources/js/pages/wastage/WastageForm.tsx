import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Trash2, Package, Hash, FileText, Loader2, DollarSign } from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  price?: number;
}

const WastageForm: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const [message, setMessage] = useState('');
  const [costPerUnit, setCostPerUnit] = useState<number | null>(null);
  const [fetchingCost, setFetchingCost] = useState(false);

  // Fetch menu items (products) - only made to order products
  useEffect(() => {
    setFetchingProducts(true);
    axios.get('/api/menu-items?prep_type=made_to_order')
      .then(res => {
        setProducts(res.data.data || res.data || []);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
      })
      .finally(() => setFetchingProducts(false));
  }, []);

  // Fetch cost per unit when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setFetchingCost(true);
      setCostPerUnit(null);
      axios.get(`/api/menu-items/${selectedProduct.id}/required-materials`, { params: { quantity: 1 } })
        .then(res => {
          const data = res.data?.data;
          if (data && data.recipe_id) {
            return axios.get(`/api/recipes/${data.recipe_id}/cost`);
          }
          return null;
        })
        .then(costRes => {
          if (costRes) {
            const costData = costRes.data?.data;
            if (costData && typeof costData.cost_per_unit === 'number') {
              setCostPerUnit(costData.cost_per_unit);
            }
          }
        })
        .catch(err => {
          console.error('Error fetching cost:', err);
          setCostPerUnit(null);
        })
        .finally(() => setFetchingCost(false));
    } else {
      setCostPerUnit(null);
    }
  }, [selectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      setMessage('Please select a product');
      return;
    }
    
    if (quantity <= 0) {
      setMessage('Quantity must be greater than 0');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('/api/wastage', {
        menu_item_id: selectedProduct.id,
        quantity,
        reason: reason || 'Manual wastage entry',
        location: 'store',
        cost: costPerUnit,
      });
      
      // Navigate back to wastage list after successful save
      navigate('/wastage');
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Error saving wastage record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-red-50 to-orange-50 py-10 px-4 flex justify-center items-start">
      <div className="w-full max-w-xl bg-white/90 rounded-2xl shadow-2xl border border-stone-200 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/wastage')}
            className="p-2 bg-white/80 border border-red-200 rounded-full shadow hover:bg-red-100 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-red-700">Back</span>
          </button>
          <h2 className="text-2xl font-extrabold text-red-700 text-center tracking-tight flex-1">Add Wastage</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-red-500" />
                Product
              </div>
            </label>
            {fetchingProducts ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading products...
              </div>
            ) : (
              <select
                className="w-full rounded-xl border border-red-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50 text-gray-700"
                value={selectedProduct?.id || ''}
                onChange={e => {
                  const prod = products.find(p => p.id === parseInt(e.target.value));
                  setSelectedProduct(prod || null);
                }}
                required
              >
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Cost Per Unit Display */}
          {selectedProduct && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Cost Per Unit</p>
                </div>
                <div className="text-right">
                  {fetchingCost ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Calculating...</span>
                    </div>
                  ) : costPerUnit !== null ? (
                    <p className="text-2xl font-bold text-green-700">
                      Rs. {costPerUnit.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-lg text-gray-400">N/A</p>
                  )}
                </div>
              </div>
         
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-red-500" />
                Quantity
              </div>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full rounded-xl border border-red-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50"
              placeholder="Enter quantity"
              required
            />
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                Reason
              </div>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-xl border border-red-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50 resize-none"
              placeholder="e.g., Expired, Damaged, Quality issue, Spillage..."
              rows={4}
            />
          </div>

          {/* Error/Message */}
          {message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedProduct}
            className={`w-full px-6 py-4 rounded-xl font-bold shadow-lg transition-all text-lg flex items-center justify-center gap-2 ${
              loading || !selectedProduct
                ? 'bg-red-200 text-red-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Add Wastage
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WastageForm;
