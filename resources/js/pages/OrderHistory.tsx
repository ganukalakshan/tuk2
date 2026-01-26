import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Eye, Search, Filter, Calendar, X, Printer } from 'lucide-react';

interface Order {
  id: number;
  order_id: string;
  table_number: number | null;
  customer_name: string | null;
  total_amount: number;
  payment_method: string | null;
  status: string;
  created_at: string;
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_status: string;
}

interface OrderDetail {
  id: number;
  order_id: string;
  customer_id: number | null;
  user_id: number;
  table_id: number | null;
  table_number: number | null;
  status: string;
  subtotal: number;
  service_charge: number;
  service_charge_amount: number;
  total_amount: number;
  cash_amount: number;
  card_amount: number;
  pickme_amount: number;
  uber_amount: number;
  additional_payment: number;
  balance: number;
  payment_method: string | null;
  kitchen_note: string | null;
  created_at: string;
  updated_at: string;
  customer: {
    id: number;
    name: string;
    phone: string;
    email: string;
  } | null;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  items: OrderItem[];
}

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const itemsPerPage = 15;

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders when search or status filter changes
  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders/recent');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data: Order[] = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search query (order_id, customer_name, table_number)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_id.toLowerCase().includes(query) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(query)) ||
        (order.table_number && order.table_number.toString().includes(query))
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleViewDetails = (orderId: number) => {
    setSelectedOrderId(orderId);
    fetchOrderDetails(orderId);
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      setDetailLoading(true);
      const response = await fetch(`/api/sales/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      const data: OrderDetail = await response.json();
      setSelectedOrderDetail(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setSelectedOrderDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedOrderId(null);
    setSelectedOrderDetail(null);
  };

  const getStatusBadgeColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      order: 'bg-blue-100 text-blue-800',
      kot: 'bg-purple-100 text-purple-800',
      bot: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodBadgeColor = (method: string | null) => {
    if (!method) return 'bg-gray-100 text-gray-700';
    const methodColors: { [key: string]: string } = {
      cash: 'bg-green-50 text-green-700',
      card: 'bg-blue-50 text-blue-700',
      pickme: 'bg-orange-50 text-orange-700',
      uber: 'bg-black-50 text-black-700',
      partial: 'bg-purple-50 text-purple-700',
    };
    return methodColors[method] || 'bg-gray-50 text-gray-700';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount).replace('LKR', 'Rs.');
  };

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  return (
    <DashboardLayout title="Order History" onBack={() => navigate('/dashboard')}>
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Order ID, Customer, or Table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="order">Order</option>
                <option value="kot">KOT</option>
                <option value="bot">BOT</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {paginatedOrders.length > 0 ? startIndex + 1 : 0} to{' '}
            {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of{' '}
            {filteredOrders.length} orders
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-semibold">Error loading orders</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && paginatedOrders.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Orders Grid */}
        {!loading && paginatedOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-xs font-medium leading-none">Order ID</p>
                      <p className="text-white text-sm font-bold truncate leading-tight">{order.order_id}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 leading-none ${getStatusBadgeColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 py-2 space-y-2 flex-grow">
                  {/* Customer Info */}
                  {order.customer_name && (
                    <div className="min-h-0">
                      <p className="text-gray-600 text-xs font-medium leading-none">Customer</p>
                      <p className="text-gray-900 font-semibold text-xs truncate leading-tight">{order.customer_name}</p>
                    </div>
                  )}

                  {/* Table Number */}
                  {order.table_number && (
                    <div className="min-h-0">
                      <p className="text-gray-600 text-xs font-medium leading-none">Table</p>
                      <p className="text-gray-900 font-semibold text-xs leading-tight">Table #{order.table_number}</p>
                    </div>
                  )}

                  {/* Date and Time */}
                  <div className="min-h-0">
                    <p className="text-gray-600 text-xs font-medium leading-none">Date & Time</p>
                    <p className="text-gray-900 text-xs leading-tight">{formatDate(order.created_at)}</p>
                  </div>

                  {/* Payment Method */}
                  {order.payment_method && (
                    <div className="min-h-0">
                      <p className="text-gray-600 text-xs font-medium leading-none">Payment</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold leading-none ${getPaymentMethodBadgeColor(order.payment_method)}`}>
                        {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
                      </span>
                    </div>
                  )}

                  {/* Total Amount */}
                  <div className="bg-blue-50 rounded p-2 border border-blue-200">
                    <p className="text-gray-600 text-xs font-medium leading-none">Total Amount</p>
                    <p className="text-blue-600 text-base font-bold leading-tight">{formatCurrency(order.total_amount)}</p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                  <button
                    onClick={() => handleViewDetails(order.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors font-medium"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg transition ${
                  currentPage === page
                    ? 'bg-blue-500 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8 pointer-events-auto">
            {detailLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : selectedOrderDetail ? (
              <>
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex justify-between items-center rounded-t-lg">
                  <div>
                    <h2 className="text-2xl font-bold">Order #{selectedOrderDetail.order_id}</h2>
                    <p className="text-blue-100 text-sm">{new Date(selectedOrderDetail.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={closeModal}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 max-h-96 overflow-y-auto space-y-6">
                  {/* Status and Customer Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      {selectedOrderDetail.customer ? (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-600 text-sm font-medium">Customer</p>
                          <p className="text-lg font-bold">{selectedOrderDetail.customer.name}</p>
                          {selectedOrderDetail.customer.phone && (
                            <p className="text-sm text-gray-600">{selectedOrderDetail.customer.phone}</p>
                          )}
                        </div>
                      ) : selectedOrderDetail.table_number ? (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-600 text-sm font-medium">Table Number</p>
                          <p className="text-lg font-bold">Table #{selectedOrderDetail.table_number}</p>
                        </div>
                      ) : null}
                    </div>

                     {/* Table Number - if customer exists */}
                  {selectedOrderDetail.customer && selectedOrderDetail.table_number && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-600 text-sm font-medium">Table Number</p>
                      <p className="text-lg font-bold">Table #{selectedOrderDetail.table_number}</p>
                    </div>
                  )}                  </div>

                 

                  {/* Order Items */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Items</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-3 font-semibold text-gray-700">Item</th>
                            <th className="text-center p-3 font-semibold text-gray-700">Qty</th>
                            <th className="text-right p-3 font-semibold text-gray-700">Price</th>
                            <th className="text-right p-3 font-semibold text-gray-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrderDetail.items.map((item, index) => (
                            <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                              <td className="p-3 text-gray-900 font-medium">{item.product_name}</td>
                              <td className="p-3 text-center text-gray-700">{item.quantity}</td>
                              <td className="p-3 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                              <td className="p-3 text-right font-semibold text-gray-900">{formatCurrency(item.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal</span>
                      <span className="font-semibold">{formatCurrency(selectedOrderDetail.subtotal)}</span>
                    </div>
                    {selectedOrderDetail.service_charge_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Service Charge ({selectedOrderDetail.service_charge}%)</span>
                        <span className="font-semibold">{formatCurrency(selectedOrderDetail.service_charge_amount)}</span>
                      </div>
                    )}
                    <div className="border-t border-blue-300 pt-2 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">{formatCurrency(selectedOrderDetail.total_amount)}</span>
                    </div>

                    {/* Payment Breakdown */}
                    {selectedOrderDetail.payment_method && (
                      <div className="mt-3 pt-3 border-t border-blue-300 space-y-1 text-sm">
                        <p className="font-semibold text-gray-700">Payment Method: {selectedOrderDetail.payment_method}</p>
                        {selectedOrderDetail.cash_amount > 0 && (
                          <p className="flex justify-between"><span>Cash:</span> <span>{formatCurrency(selectedOrderDetail.cash_amount)}</span></p>
                        )}
                        {selectedOrderDetail.card_amount > 0 && (
                          <p className="flex justify-between"><span>Card:</span> <span>{formatCurrency(selectedOrderDetail.card_amount)}</span></p>
                        )}
                        {selectedOrderDetail.pickme_amount > 0 && (
                          <p className="flex justify-between"><span>PickMe:</span> <span>{formatCurrency(selectedOrderDetail.pickme_amount)}</span></p>
                        )}
                        {selectedOrderDetail.uber_amount > 0 && (
                          <p className="flex justify-between"><span>Uber:</span> <span>{formatCurrency(selectedOrderDetail.uber_amount)}</span></p>
                        )}
                      </div>
                    )}

                    {selectedOrderDetail.balance !== 0 && (
                      <div className={`text-sm font-bold flex justify-between ${selectedOrderDetail.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        <span>{selectedOrderDetail.balance > 0 ? 'Amount Due' : 'Change'}</span>
                        <span>{formatCurrency(Math.abs(selectedOrderDetail.balance))}</span>
                      </div>
                    )}
                  </div>

                  {selectedOrderDetail.kitchen_note && (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <p className="text-gray-600 text-sm font-medium">Kitchen Note</p>
                      <p className="text-gray-900 italic">{selectedOrderDetail.kitchen_note}</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-100 p-4 rounded-b-lg border-t border-gray-200 flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition font-medium"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-red-600">
                <p>Error loading order details</p>
                <button
                  onClick={closeModal}
                  className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}    </DashboardLayout>
  );
};

export default OrderHistory;