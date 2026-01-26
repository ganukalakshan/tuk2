import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

interface OrderHistoryItem {
  id: number;
  order_id: string;
  table_number: number;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/orders/recent');
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate2 = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch(method) {
      case 'cash':
        return 'bg-blue-100 text-blue-800';
      case 'card':
        return 'bg-purple-100 text-purple-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      case 'pickme':
        return 'bg-pink-100 text-pink-800';
      case 'uber':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-8">
        <div className="flex items-center justify-center">
          <Loader className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="text-stone-400 ml-3">Loading order history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-red-900/50 p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-800 to-stone-900 border-b border-stone-700/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Order History</h3>
              <p className="text-stone-400 text-sm">Recent transactions</p>
            </div>
          </div>
          <button 
            onClick={fetchRecentOrders}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="divide-y divide-stone-700/50">
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-stone-400">No recent orders found</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="p-4 hover:bg-stone-800/50 transition-colors">
              <div className="flex items-center justify-between">
                {/* Left: Order Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold">{order.order_id}</span>
                      <span className="text-stone-500 text-sm">•</span>
                      <span className="text-stone-400 text-sm">Table {order.table_number}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="text-stone-300">
                      {order.customer_name || 'Walk-in Customer'}
                    </p>
                  </div>
                </div>

                {/* Middle: Amount & Method */}
                <div className="text-right mx-4">
                  <p className="text-white font-semibold text-lg">
                    LKR {parseFloat(String(order.total_amount)).toFixed(2)}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getPaymentMethodColor(order.payment_method)}`}>
                    {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
                  </span>
                </div>

                {/* Right: Time */}
                <div className="text-right w-24">
                  <p className="text-stone-300 text-sm font-medium">
                    {formatDate(order.created_at)}
                  </p>
                  <p className="text-stone-500 text-xs">
                    {formatDate2(order.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {orders.length > 0 && (
        <div className="bg-stone-800/50 border-t border-stone-700/50 p-4 text-center">
          <p className="text-stone-400 text-sm">
            Showing {orders.length} recent orders
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
