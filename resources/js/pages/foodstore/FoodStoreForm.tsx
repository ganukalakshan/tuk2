import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FoodStoreForm: React.FC = () => {
    const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [recipe, setRecipe] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [productionCost, setProductionCost] = useState<number|null>(null);

  // Fetch ready-made products
  useEffect(() => {
    axios.get('/api/menu-items/ready-made').then(res => {
        console.log('Ready made products:', res.data);
      setProducts(res.data.data);
    });
  }, []);

  // Fetch recipe and required materials when product or quantity changes
  useEffect(() => {
    if (selectedProduct && quantity > 0) {
      setLoading(true);
      axios.get(`/api/menu-items/${selectedProduct.id}/required-materials`, { params: { quantity } })
        .then(res => {
          const data = res.data?.data;
          const mats = Array.isArray(data?.materials) ? data.materials : [];
          setRecipe(data);
          setMaterials(mats);
          // Fetch production cost for this recipe and quantity
          if (data && data.recipe_id) {
            axios.get(`/api/recipes/${data.recipe_id}/cost`).then(costRes => {
              const costData = costRes.data?.data;
              if (costData && typeof costData.cost_per_unit === 'number') {
                setProductionCost(costData.cost_per_unit);
              } else {
                setProductionCost(null);
              }
            }).catch(() => setProductionCost(null));
          } else {
            setProductionCost(null);
          }
          return axios.post('/api/store/check-raw-materials', {
            requirements: mats.map((m: any) => ({
              material_id: m.material_id,
              required_quantity: m.required_quantity
            }))
          });
        })
        .then(res => {
          setAvailability(res.data.data);
        })
        .finally(() => setLoading(false));
    } else {
      setRecipe(null);
      setMaterials([]);
      setAvailability([]);
      setProductionCost(null);
    }
  }, [selectedProduct, quantity]);

  // Calculate expiry date (example: 3 days from now)
  useEffect(() => {
    if (selectedProduct) {
      const days = selectedProduct.shelf_life || 3;
      const date = new Date();
      date.setDate(date.getDate() + days);
      setExpiryDate(date.toISOString().slice(0, 10));
    } else {
      setExpiryDate('');
    }
  }, [selectedProduct]);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post('/api/store/save-ready-made', {
        menu_item_id: selectedProduct.id,
        quantity,
        cost: productionCost,
      });
      // Navigate back to food store list after successful save
      navigate('/food-store');
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Error saving');
    } finally {
      setLoading(false);
    }
  };

    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-yellow-100 py-10 px-4 flex justify-center items-start">
        <div className="w-full max-w-3xl bg-white/90 rounded-2xl shadow-2xl border border-stone-200 p-10">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/food-store')}
              className="p-2 bg-white/80 border border-amber-200 rounded-full shadow hover:bg-amber-100 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="font-semibold text-amber-700">Back</span>
            </button>
            <h2 className="text-3xl font-extrabold text-amber-700 text-center tracking-tight flex-1">Food Store Production</h2>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-amber-800 mb-1">Product</label>
            <select
              className="w-full rounded-lg border border-amber-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50"
              value={selectedProduct?.id || ''}
              onChange={e => {
                const prod = products.find((p: any) => p.id === parseInt(e.target.value));
                setSelectedProduct(prod || null);
              }}
            >
              <option value=''>Select product</option>
              {(Array.isArray(products) ? products : []).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {selectedProduct && (
            <>
              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-amber-800 mb-1">Quantity</label>
                  <input
                    type='number'
                    min='1'
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full rounded-lg border border-amber-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-amber-800 mb-1">Expiry Date</label>
                  <input
                    type='date'
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full rounded-lg border border-amber-200 px-3 py-2 bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Cost Display Section */}
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">Cost Per Unit</p>
                  </div>
                  <div className="text-right">
                    {productionCost !== null ? (
                      <p className="text-2xl font-bold text-green-700">
                        Rs. {productionCost.toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-lg text-gray-400">Calculating...</p>
                    )}
                  </div>
                </div>
              </div>

              <h4 className="text-xl font-bold text-amber-700 mt-8 mb-4">Required Raw Materials</h4>
              <div className="overflow-x-auto rounded-xl border border-amber-100 bg-amber-50 shadow">
                <table className="min-w-full text-base text-left">
                  <thead className="bg-amber-100 text-amber-800">
                    <tr>
                      <th className="py-3 px-4 font-bold">Material</th>
                      <th className="py-3 px-4 font-bold">Required</th>
                      <th className="py-3 px-4 font-bold">Available</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(materials) ? materials : []).map((m: any, idx: number) => {
                      const avail = (Array.isArray(availability) ? availability : []).find(a => a.material_id === m.material_id);
                      return (
                        <tr key={m.material_id} className="border-t border-amber-100">
                          <td className="py-3 px-4">{m.material_name}</td>
                          <td className="py-3 px-4">{m.required_quantity} {m.unit}</td>
                          <td className="py-3 px-4">{avail ? avail.available : '?'}</td>
                          <td className={
                            'py-3 px-4 font-bold ' +
                            (avail ? (avail.enough ? 'text-green-600' : 'text-red-600') : 'text-gray-400')
                          }>
                            {avail ? (avail.enough ? 'Enough' : 'Not enough') : '?'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-8 flex justify-end gap-6 items-center">
                <button
                  disabled={loading || availability.some(a => !a.enough)}
                  onClick={handleSave}
                  className={
                    'px-8 py-3 rounded-xl font-bold shadow-lg transition-all text-lg ' +
                    (loading || availability.some(a => !a.enough)
                      ? 'bg-amber-200 text-amber-500 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-600 text-white')
                  }
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                {message && <div className="text-base text-amber-700 font-semibold">{message}</div>}
              </div>
            </>
          )}
        </div>
      </div>
    );
};

export default FoodStoreForm;
