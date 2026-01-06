import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { 
  CreditCard, 
  Plus, 
  ShoppingCart, 
  Clock,
  CheckCircle,
  DollarSign,
  Coffee,
  Users
} from 'lucide-react';

const CashierDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Cashier Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Ready to serve! ☕
          </h2>
          <p className="text-stone-400">
            Process orders, handle payments, and provide excellent customer service.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-400 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-stone-400 text-sm font-medium">Orders Completed</h3>
            <p className="text-2xl font-bold text-white mt-1">23</p>
            <p className="text-green-400 text-sm mt-2">This shift</p>
          </div>

          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-stone-400 text-sm font-medium">Sales Total</h3>
            <p className="text-2xl font-bold text-white mt-1">$487.30</p>
            <p className="text-blue-400 text-sm mt-2">Current shift</p>
          </div>

          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-400 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-stone-400 text-sm font-medium">Avg Order Time</h3>
            <p className="text-2xl font-bold text-white mt-1">3.8 min</p>
            <p className="text-amber-400 text-sm mt-2">Your performance</p>
          </div>

          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-400 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-stone-400 text-sm font-medium">Customers Served</h3>
            <p className="text-2xl font-bold text-white mt-1">47</p>
            <p className="text-purple-400 text-sm mt-2">Happy customers!</p>
          </div>
        </div>

        {/* Main Action Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Order Card */}
          <div className="lg:col-span-2">
            <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Start New Order</h3>
              <p className="text-stone-400 mb-6 max-w-md mx-auto">
                Begin a new customer order by selecting items from the menu and processing payment.
              </p>
              <button 
                onClick={() => navigate('/pos-billing')}
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-stone-900 font-semibold py-3 px-8 rounded-lg transition-all duration-200 inline-flex items-center space-x-2"
              >
                <Coffee className="w-5 h-5" />
                <span>New Order</span>
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6 hover:border-amber-500/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-400 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold">Process Payment</h3>
              </div>
              <p className="text-stone-400 text-sm">Handle card, cash, or digital payments</p>
            </div>

            <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6 hover:border-amber-500/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold">View Order Queue</h3>
              </div>
              <p className="text-stone-400 text-sm">Check pending and active orders</p>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
          <h3 className="text-white text-lg font-semibold mb-6 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-amber-400" />
            Recent Orders
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { 
                id: '#1247', 
                time: '2:45 PM', 
                total: '$8.50', 
                items: ['Cappuccino', 'Blueberry Muffin'], 
                status: 'completed' 
              },
              { 
                id: '#1248', 
                time: '2:38 PM', 
                total: '$12.75', 
                items: ['Latte', 'Caesar Salad'], 
                status: 'completed' 
              },
              { 
                id: '#1249', 
                time: '2:33 PM', 
                total: '$6.25', 
                items: ['Espresso', 'Croissant'], 
                status: 'completed' 
              },
              { 
                id: '#1250', 
                time: '2:28 PM', 
                total: '$15.90', 
                items: ['Americano', 'Club Sandwich', 'Cookie'], 
                status: 'completed' 
              },
              { 
                id: '#1251', 
                time: '2:22 PM', 
                total: '$9.40', 
                items: ['Mocha', 'Bagel with Cream Cheese'], 
                status: 'completed' 
              },
              { 
                id: '#1252', 
                time: '2:15 PM', 
                total: '$22.35', 
                items: ['2x Latte', 'Avocado Toast', 'Fruit Bowl'], 
                status: 'completed' 
              },
            ].map((order) => (
              <div key={order.id} className="bg-stone-800/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-white font-medium">{order.id}</span>
                    <p className="text-stone-400 text-sm">{order.time}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-green-400 font-semibold">{order.total}</span>
                    <div className="mt-1">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-stone-300 text-sm">
                    {order.items.join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CashierDashboard;