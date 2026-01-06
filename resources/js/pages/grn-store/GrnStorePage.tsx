import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Store,
  Package,
  Loader2,
  ChevronDown,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface GrnMaterial {
  id: number;
  material_name: string;
  quantity: number;
  unit: string;
  unit_id?: number;
  unit_symbol?: string;
  conversion_to_base: number;
  grn_id: number;
  batch_number: string;
  material_id: number;
  store_category?: string;
}

const GrnStorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availableMaterials, setAvailableMaterials] = useState<GrnMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<GrnMaterial[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');

  const categories = [
    { value: 'all', label: 'All Stores' },
    { value: 'hot_kitchen', label: 'Hot Kitchen' },
    { value: 'beverage', label: 'Beverage' },
    { value: 'pastry', label: 'Pastry' },
    { value: 'bakery', label: 'Bakery' },
  ];

  useEffect(() => {
    fetchMaterials(selectedCategory);
  }, [selectedCategory]);

  const fetchMaterials = async (category: string) => {
    try {
      setLoading(true);
      
      // When "all" is selected, fetch from GRN available materials
      // Otherwise, fetch from the specific store
      const endpoint = category === 'all' 
        ? '/api/grn-store/available-materials'
        : `/api/grn-store/${category}`;
      
      const response = await axios.get(endpoint);
      const materials: GrnMaterial[] = response.data;

      // Group materials by name and sum quantities (converted to base unit)
      const groupedMaterials = Object.values(
        materials.reduce((acc: { [key: string]: GrnMaterial & { quantity_in_base: number, base_unit: string } }, item) => {
          const key = item.material_name;
          // Convert quantity to base unit for accurate summing
          const quantityInBase = parseFloat(item.quantity.toString()) * (item.conversion_to_base || 1);
          
          if (!acc[key]) {
            acc[key] = {
              id: item.id,
              material_name: item.material_name,
              quantity: 0,
              quantity_in_base: 0,
              unit: item.unit,
              unit_id: item.unit_id,
              unit_symbol: item.unit_symbol || item.unit,
              conversion_to_base: item.conversion_to_base || 1,
              grn_id: item.grn_id,
              batch_number: item.batch_number,
              material_id: item.material_id,
              base_unit: item.conversion_to_base === 1 ? item.unit : 'base'
            };
          }
          // Sum in base unit
          acc[key].quantity_in_base = (acc[key].quantity_in_base || 0) + quantityInBase;
          // Convert back to display unit (use the first item's unit as reference)
          acc[key].quantity = acc[key].quantity_in_base / (acc[key].conversion_to_base || 1);
          return acc;
        }, {})
      );

      setAvailableMaterials(materials);
      setFilteredMaterials(groupedMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBatches = (materialName: string) => {
    setSelectedMaterial(materialName);
    setShowBatchModal(true);
  };

  const getBatchDetails = (materialName: string) => {
    return availableMaterials
      .filter(item => item.material_name === materialName)
      .map((item) => ({
        batchNumber: item.batch_number,
        grnId: item.grn_id,
        quantity: parseFloat(item.quantity.toString()),
        unit: item.unit,
        unit_symbol: item.unit_symbol || item.unit,
        conversion_to_base: item.conversion_to_base || 1
      }));
  };

  // Get total quantity in base unit, then convert to display unit
  const getTotalQuantity = (materialName: string) => {
    const items = availableMaterials.filter(item => item.material_name === materialName);
    if (items.length === 0) return { total: 0, unit: '' };
    
    // Sum all quantities in base unit
    const totalInBase = items.reduce((sum, item) => {
      const conversion = item.conversion_to_base || 1;
      return sum + (parseFloat(item.quantity.toString()) * conversion);
    }, 0);
    
    // Use the base unit (conversion_to_base = 1) as the display unit, or the first item's unit
    const baseItem = items.find(item => item.conversion_to_base === 1) || items[0];
    const displayUnit = baseItem.unit_symbol || baseItem.unit;
    const displayConversion = baseItem.conversion_to_base || 1;
    
    return {
      total: totalInBase / displayConversion,
      unit: displayUnit
    };
  };

  // Calculate overall total (sum all quantities in their base units)
  const getOverallTotal = () => {
    return filteredMaterials.reduce((sum, item) => {
      const conversion = item.conversion_to_base || 1;
      return sum + (parseFloat(item.quantity.toString()) * conversion);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
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
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md shadow-indigo-500/20">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">GRN Store</h1>
                <p className="text-xs text-slate-500">Materials from Available GRN</p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <span className="text-sm text-slate-600">{user?.name}</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Category Selection Card */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Store Category</h2>
              <p className="text-xs text-slate-500">Select category to view materials</p>
            </div>
          </div>
          
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-64 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-600 pointer-events-none" />
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md shadow-indigo-500/20">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-slate-500 text-xs font-medium mb-1">Available Materials</h3>
            <p className="text-2xl font-bold text-slate-800">{filteredMaterials.length}</p>
            <p className="text-slate-500 text-xs mt-1">From GRN</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md shadow-purple-500/20">
                <Store className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-slate-500 text-xs font-medium mb-1">Selected Category</h3>
            <p className="text-xl font-bold text-slate-800">
              {categories.find(c => c.value === selectedCategory)?.label}
            </p>
            <p className="text-slate-500 text-xs mt-1">Current selection</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md shadow-green-500/20">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-slate-500 text-xs font-medium mb-1">Total Quantity</h3>
            <p className="text-2xl font-bold text-slate-800">
              {getOverallTotal().toFixed(2)}
            </p>
            <p className="text-slate-500 text-xs mt-1">All materials (base units)</p>
          </div>
        </div>

        {/* Materials Table */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700">
              {selectedCategory === 'all' 
                ? 'Available Materials from GRN' 
                : `Materials in ${categories.find(c => c.value === selectedCategory)?.label}`
              }
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {selectedCategory === 'all'
                ? 'All materials ready to be assigned to stores'
                : `Materials currently stored in ${categories.find(c => c.value === selectedCategory)?.label}`
              }
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="p-4 bg-slate-100 rounded-full mb-4">
                <Package className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">
                No Materials Available
              </h3>
              <p className="text-slate-500 text-center max-w-sm">
                No materials from GRN are currently available
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Material Name
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.map((material) => (
                    <tr 
                      key={material.id}
                      className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-indigo-600" />
                          </div>
                          <p className="text-sm font-medium text-slate-800">{material.material_name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-lg font-bold text-slate-800">
                          {parseFloat(material.quantity.toString()).toFixed(2)}
                        </span>
                        <span className="ml-2 text-xs text-slate-500">{material.unit}</span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleViewBatches(material.material_name)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-150"
                          title="View Batches"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Batch Details Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Batch-wise Quantity Details</h3>
                <p className="text-indigo-100 text-xs mt-0.5">Material: {selectedMaterial}</p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              {/* Total Quantity Summary */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-0.5">Total Quantity</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {getTotalQuantity(selectedMaterial).total.toFixed(2)} <span className="text-sm font-medium text-slate-500">{getTotalQuantity(selectedMaterial).unit}</span>
                    </p>
                  </div>
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Batch List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Batch Breakdown
                </h4>
                {getBatchDetails(selectedMaterial).map((batch) => (
                  <div
                    key={batch.batchNumber}
                    className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-indigo-600">
                            {batch.batchNumber.split('-').pop()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {batch.batchNumber}
                          </p>
                          <p className="text-xs text-slate-500">GRN ID: {batch.grnId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-800">
                          {batch.quantity.toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500">{batch.unit}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 flex justify-end">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-5 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrnStorePage;
