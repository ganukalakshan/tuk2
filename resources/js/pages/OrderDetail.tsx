import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { ArrowLeft, Printer, Download, AlertCircle } from 'lucide-react';

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

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sales/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      const data: OrderDetail = await response.json();
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setOrder(null);
    } finally {
      setLoading(false);
    }
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

  const getItemStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      kot: 'bg-purple-50 border-purple-200 text-purple-800',
      bot: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      completed: 'bg-green-50 border-green-200 text-green-800',
    };
    return colors[status] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <DashboardLayout title="Order Details">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Order Details">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex gap-3">
            <AlertCircle className="text-red-600 w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Error Loading Order</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => navigate('/orders')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout title="Order Details">
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Order not found</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Back to Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const totalPayments = order.cash_amount + order.card_amount + order.pickme_amount + order.uber_amount + order.additional_payment;

  return (
    <DashboardLayout title="Order Details">
      <div className="space-y-6 print:space-y-4">
        {/* Back Button and Actions */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* Order Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-blue-100 text-sm font-medium">Order ID</p>
              <p className="text-2xl font-bold">{order.order_id}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">Status</p>
              <p className="text-xl font-bold capitalize">{order.status}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">Order Date</p>
              <p className="text-lg font-semibold">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">Time</p>
              <p className="text-lg font-semibold">{new Date(order.created_at).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items Section - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>

            {order.items && order.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">Item</th>
                      <th className="text-center py-3 px-4 text-gray-700 font-semibold">Qty</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">Unit Price</th>
                      <th className="text-right py-3 px-4 text-gray-700 font-semibold">Total</th>
                      <th className="text-center py-3 px-4 text-gray-700 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-medium">{item.product_name}</td>
                        <td className="py-3 px-4 text-center text-gray-700">{item.quantity}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(item.total_price)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getItemStatusColor(item.item_status)}`}>
                            {item.item_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No items in this order</p>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>

                {order.service_charge_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Service Charge ({order.service_charge}%)</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(order.service_charge_amount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-4 text-lg font-bold">
                <span className="text-gray-900">Total Amount</span>
                <span className="text-blue-600 text-2xl">{formatCurrency(order.total_amount)}</span>
              </div>

              {/* Status Badge */}
              <div className={`px-4 py-2 rounded-lg text-center text-sm font-semibold ${getStatusBadgeColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Details</h3>

              <div className="space-y-2 text-sm">
                {order.payment_method && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method</span>
                    <span className="font-semibold text-gray-900 capitalize">{order.payment_method}</span>
                  </div>
                )}

                {order.cash_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cash</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(order.cash_amount)}</span>
                  </div>
                )}

                {order.card_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Card</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(order.card_amount)}</span>
                  </div>
                )}

                {order.pickme_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">PickMe</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(order.pickme_amount)}</span>
                  </div>
                )}

                {order.uber_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uber</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(order.uber_amount)}</span>
                  </div>
                )}

                {order.additional_payment > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(order.additional_payment)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Paid</span>
                    <span className="font-bold text-gray-900">{formatCurrency(totalPayments)}</span>
                  </div>
                </div>

                {order.balance !== 0 && (
                  <div className={`flex justify-between text-base font-bold pt-2 ${order.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    <span>{order.balance > 0 ? 'Amount Due' : 'Change'}</span>
                    <span>{formatCurrency(Math.abs(order.balance))}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Info</h3>

              <div className="space-y-3 text-sm">
                {order.customer && (
                  <div>
                    <p className="text-gray-600 font-medium">Customer</p>
                    <p className="text-gray-900">{order.customer.name}</p>
                    {order.customer.phone && (
                      <p className="text-gray-600 text-xs">{order.customer.phone}</p>
                    )}
                  </div>
                )}

                {order.table_number && (
                  <div>
                    <p className="text-gray-600 font-medium">Table</p>
                    <p className="text-gray-900">Table #{order.table_number}</p>
                  </div>
                )}

                {order.user && (
                  <div>
                    <p className="text-gray-600 font-medium">Cashier</p>
                    <p className="text-gray-900">{order.user.name}</p>
                  </div>
                )}

                {order.kitchen_note && (
                  <div>
                    <p className="text-gray-600 font-medium">Kitchen Note</p>
                    <p className="text-gray-900 italic">{order.kitchen_note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:space-y-4 > * + * {
            margin-top: 1rem;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default OrderDetail;
