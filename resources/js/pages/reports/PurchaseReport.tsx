import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Calendar,
  User,
} from 'lucide-react';

interface PurchaseItem {
  material_name: string;
  requested_quantity: number;
  approved_quantity: number;
  received_quantity: number;
  requested_unit_price: number;
  approved_unit_price: number;
  received_unit_price: number;
  requested_amount: number;
  approved_amount: number;
  received_amount: number;
  quantity_variance: number;
  cost_variance: number;
  unit: string;
}

interface Purchase {
  id: number;
  request_number: string;
  request_date: string;
  po_number: string | null;
  po_date: string | null;
  grn_number: string | null;
  grn_date: string | null;
  supplier_name: string;
  created_by_name: string;
  approved_by_name: string | null;
  received_by_name: string | null;
  status: string;
  requested_amount: number;
  approved_amount: number;
  received_amount: number;
  days_to_approval: number | null;
  days_to_receipt: number | null;
  total_lead_time: number | null;
  items: PurchaseItem[];
}

interface ReportSummary {
  total_requests: number;
  total_requested_amount: number;
  total_approved_amount: number;
  total_received_amount: number;
  average_approval_days: number;
  average_receipt_days: number;
  average_total_lead_time: number;
  pending_requests: number;
  approved_requests: number;
  completed_requests: number;
}

interface SupplierData {
  supplier_id: number;
  supplier_name: string;
  total_orders: number;
  total_amount: number;
  average_approval_days: number;
}

interface UserType {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

export default function PurchaseReport() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [supplierData, setSupplierData] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expandedPurchase, setExpandedPurchase] = useState<number | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('all');
  const [supplierId, setSupplierId] = useState('all');
  const [createdBy, setCreatedBy] = useState('all');

  useEffect(() => {
    fetchUsers();
    fetchSuppliers();
    fetchReport();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      // Ensure we always set an array
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]); // Set empty array on error
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers');
      // Ensure we always set an array
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setSuppliers([]); // Set empty array on error
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (status !== 'all') params.append('status', status);
      if (supplierId !== 'all') params.append('supplier_id', supplierId);
      if (createdBy !== 'all') params.append('created_by', createdBy);

      const response = await axios.get(`/api/reports/purchases?${params.toString()}`);
      // Ensure purchases is always an array
      setPurchases(Array.isArray(response.data?.purchases) ? response.data.purchases : []);
      setSummary(response.data?.summary || null);

      // Fetch supplier data
      const supplierResponse = await axios.get(`/api/reports/purchases/supplier?${params.toString()}`);
      // Ensure supplierData is always an array
      setSupplierData(Array.isArray(supplierResponse.data) ? supplierResponse.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching report');
      console.error('Error:', err);
      // Reset to safe defaults on error
      setPurchases([]);
      setSupplierData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (status !== 'all') params.append('status', status);
      if (supplierId !== 'all') params.append('supplier_id', supplierId);
      if (createdBy !== 'all') params.append('created_by', createdBy);

      const response = await axios.get(`/api/reports/purchases/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `purchase_report_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting report:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      approved: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    };
    const config = configs[status as keyof typeof configs] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Purchase Report</h1>
                  <p className="text-sm text-slate-500">Track purchases from request to receipt</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={loading || purchases.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Created By</label>
              <select
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReport}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-600">Total Requests</p>
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800 mb-3">{summary.total_requests}</p>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-700">
                      Pending: {summary.pending_requests}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                      Done: {summary.completed_requests}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-600">Requested Amount</p>
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">{formatCurrency(summary.total_requested_amount)}</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-600">Received Amount</p>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">{formatCurrency(summary.total_received_amount)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {summary.total_received_amount > summary.total_requested_amount ? (
                      <TrendingUp className="w-4 h-4 text-red-600" />
                    ) : summary.total_received_amount < summary.total_requested_amount ? (
                      <TrendingDown className="w-4 h-4 text-green-600" />
                    ) : null}
                    <span className="text-sm text-slate-600">
                      Variance: {formatCurrency(summary.total_received_amount - summary.total_requested_amount)}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-600">Avg Lead Time</p>
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">{summary.average_total_lead_time.toFixed(1)} days</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-slate-600">Approval: {summary.average_approval_days.toFixed(1)} days</p>
                    <p className="text-xs text-slate-600">Receipt: {summary.average_receipt_days.toFixed(1)} days</p>
                  </div>
                </div>
              </div>
            )}

            {/* Supplier Performance */}
            {supplierData.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Supplier Performance</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Supplier</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Orders</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Total Amount</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Avg Approval Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierData.map((supplier) => (
                        <tr key={supplier.supplier_id} className="border-b border-slate-100">
                          <td className="px-4 py-3 text-sm text-slate-800">{supplier.supplier_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-800 text-right">{supplier.total_orders}</td>
                          <td className="px-4 py-3 text-sm text-slate-800 text-right">{formatCurrency(supplier.total_amount)}</td>
                          <td className="px-4 py-3 text-sm text-slate-800 text-right">{supplier.average_approval_days.toFixed(1)} days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Purchase Details */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Purchase Details</h2>
              {purchases.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No purchases found for the selected filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedPurchase(expandedPurchase === purchase.id ? null : purchase.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-left">
                            <p className="font-semibold text-slate-800">{purchase.request_number}</p>
                            <p className="text-sm text-slate-600">
                              {purchase.supplier_name} • {formatDate(purchase.request_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(purchase.status)}
                          <p className="text-lg font-bold text-slate-800 min-w-[120px] text-right">
                            {formatCurrency(purchase.requested_amount)}
                          </p>
                          {expandedPurchase === purchase.id ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {expandedPurchase === purchase.id && (
                        <div className="border-t border-slate-200 bg-slate-50 p-6">
                          {/* Timeline */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                              <p className="text-xs font-semibold text-slate-500 mb-2">Purchase Request</p>
                              <p className="text-sm font-medium text-slate-800">{purchase.request_number}</p>
                              <p className="text-sm text-slate-600">{formatDate(purchase.request_date)}</p>
                              <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                <User className="w-3 h-3" />
                                {purchase.created_by_name}
                              </p>
                              <p className="text-sm font-semibold text-slate-800 mt-2">
                                {formatCurrency(purchase.requested_amount)}
                              </p>
                            </div>

                            <div className={`rounded-lg border p-4 ${purchase.po_number ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200'}`}>
                              <p className="text-xs font-semibold text-slate-500 mb-2">Purchase Order</p>
                              {purchase.po_number ? (
                                <>
                                  <p className="text-sm font-medium text-slate-800">{purchase.po_number}</p>
                                  <p className="text-sm text-slate-600">{formatDate(purchase.po_date!)}</p>
                                  <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                    <User className="w-3 h-3" />
                                    {purchase.approved_by_name || 'N/A'}
                                  </p>
                                  <p className="text-sm font-semibold text-slate-800 mt-2">
                                    {formatCurrency(purchase.approved_amount)}
                                  </p>
                                  {purchase.days_to_approval && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      ⏱ {purchase.days_to_approval} days
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm text-slate-400">Not yet created</p>
                              )}
                            </div>

                            <div className={`rounded-lg border p-4 ${purchase.grn_number ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200'}`}>
                              <p className="text-xs font-semibold text-slate-500 mb-2">GRN (Receipt)</p>
                              {purchase.grn_number ? (
                                <>
                                  <p className="text-sm font-medium text-slate-800">{purchase.grn_number}</p>
                                  <p className="text-sm text-slate-600">{formatDate(purchase.grn_date!)}</p>
                                  <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                    <User className="w-3 h-3" />
                                    {purchase.received_by_name || 'N/A'}
                                  </p>
                                  <p className="text-sm font-semibold text-slate-800 mt-2">
                                    {formatCurrency(purchase.received_amount)}
                                  </p>
                                  {purchase.days_to_receipt && (
                                    <p className="text-xs text-green-600 mt-1">
                                      ⏱ {purchase.days_to_receipt} days
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm text-slate-400">Not yet received</p>
                              )}
                            </div>
                          </div>

                          {purchase.total_lead_time && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                              <p className="text-sm font-semibold text-purple-900">
                                Total Lead Time: {purchase.total_lead_time} days
                              </p>
                            </div>
                          )}

                          {/* Items Table */}
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
                              <p className="text-sm font-semibold text-slate-700">Items</p>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Material</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Requested</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Approved</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Received</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Qty Variance</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Unit Price</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Cost Variance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {purchase.items.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-100">
                                      <td className="px-4 py-3 text-sm text-slate-800">{item.material_name}</td>
                                      <td className="px-4 py-3 text-sm text-slate-800 text-right">
                                        {item.requested_quantity.toFixed(2)} {item.unit}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-800 text-right">
                                        {item.approved_quantity.toFixed(2)} {item.unit}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-800 text-right">
                                        {item.received_quantity.toFixed(2)} {item.unit}
                                      </td>
                                      <td className={`px-4 py-3 text-sm text-right font-medium ${
                                        item.quantity_variance > 0
                                          ? 'text-red-600'
                                          : item.quantity_variance < 0
                                            ? 'text-green-600'
                                            : 'text-slate-800'
                                      }`}>
                                        {item.quantity_variance > 0 ? '+' : ''}
                                        {item.quantity_variance.toFixed(2)} {item.unit}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-slate-800 text-right">
                                        {formatCurrency(item.received_unit_price)}
                                      </td>
                                      <td className={`px-4 py-3 text-sm text-right font-medium ${
                                        item.cost_variance > 0
                                          ? 'text-red-600'
                                          : item.cost_variance < 0
                                            ? 'text-green-600'
                                            : 'text-slate-800'
                                      }`}>
                                        {item.cost_variance > 0 ? '+' : ''}
                                        {formatCurrency(item.cost_variance)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
