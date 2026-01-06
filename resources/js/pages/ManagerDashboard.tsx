import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { 
  ShoppingCart, 
  Users, 
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Manager Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Good morning, Manager! 👋
          </h2>
          <p className="text-stone-400">
            Keep track of your shift operations, active orders, and team performance.
          </p>
        </div>

        {/* Live Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Orders */}
          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-400 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Live
                </span>
              </div>
            </div>
            <h3 className="text-stone-400 text-sm font-medium">Active Orders</h3>
            <p className="text-2xl font-bold text-white mt-1">14</p>
            <p className="text-orange-400 text-sm mt-2">3 pending, 11 in progress</p>
          </div>

          {/* Tables Occupied */}
          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-stone-400 text-sm font-medium">Tables Occupied</h3>
            <p className="text-2xl font-bold text-white mt-1">18 / 24</p>
            <p className="text-blue-400 text-sm mt-2">75% occupancy rate</p>
          </div>

          {/* Stock Alerts */}
          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-400 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <Package className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-stone-400 text-sm font-medium">Stock Alerts</h3>
            <p className="text-2xl font-bold text-white mt-1">5</p>
            <p className="text-red-400 text-sm mt-2">Items running low</p>
          </div>

          {/* Shift Progress */}
          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-400 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-stone-400 text-sm font-medium">Shift Progress</h3>
            <p className="text-2xl font-bold text-white mt-1">62%</p>
            <p className="text-green-400 text-sm mt-2">3h 8m remaining</p>
          </div>
        </div>

        {/* Active Orders & Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
            <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-amber-400" />
              Recent Orders
            </h3>
            <div className="space-y-3">
              {[
                { id: '#1247', status: 'preparing', time: '2m ago', items: 'Cappuccino, Croissant' },
                { id: '#1248', status: 'ready', time: '5m ago', items: 'Espresso, Blueberry Muffin' },
                { id: '#1249', status: 'pending', time: '7m ago', items: 'Latte, Caesar Salad' },
                { id: '#1250', status: 'preparing', time: '12m ago', items: 'Americano, Sandwich' },
              ].map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{order.id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'ready' 
                          ? 'bg-green-100 text-green-800' 
                          : order.status === 'preparing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-stone-400 text-sm mt-1">{order.items}</p>
                  </div>
                  <span className="text-stone-500 text-xs">{order.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6">
            <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-red-400" />
              Inventory Alerts
            </h3>
            <div className="space-y-3">
              {[
                { item: 'Arabica Coffee Beans', level: '12%', status: 'critical' },
                { item: 'Whole Milk', level: '28%', status: 'low' },
                { item: 'Sandwich Bread', level: '31%', status: 'low' },
                { item: 'Paper Cups (Large)', level: '8%', status: 'critical' },
              ].map((alert) => (
                <div key={alert.item} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{alert.item}</p>
                    <p className="text-stone-400 text-sm">Stock level: {alert.level}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.status === 'critical' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            onClick={() => navigate('/purchase-requests')}
            className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6 hover:border-teal-500/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-teal-400 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white text-lg font-semibold">Purchase Request</h3>
            </div>
            <p className="text-stone-400 text-sm mb-4">
              Create and submit raw material purchase requests.
            </p>
            <button className="text-teal-400 text-sm font-medium hover:text-teal-300">
              New Request →
            </button>
          </div>

          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6 hover:border-amber-500/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white text-lg font-semibold">Staff Schedule</h3>
            </div>
            <p className="text-stone-400 text-sm mb-4">
              View and manage current shift schedules and staff assignments.
            </p>
            <button className="text-amber-400 text-sm font-medium hover:text-amber-300">
              Manage Schedule →
            </button>
          </div>

          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6 hover:border-amber-500/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-400 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white text-lg font-semibold">Order Management</h3>
            </div>
            <p className="text-stone-400 text-sm mb-4">
              Monitor all active orders, update statuses, and manage kitchen workflow.
            </p>
            <button className="text-amber-400 text-sm font-medium hover:text-amber-300">
              View Orders →
            </button>
          </div>

          <div className="bg-stone-900/50 backdrop-blur-xl rounded-2xl border border-stone-700/50 p-6 hover:border-amber-500/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-400 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white text-lg font-semibold">Inventory Check</h3>
            </div>
            <p className="text-stone-400 text-sm mb-4">
              Update stock levels, order supplies, and manage inventory alerts.
            </p>
            <button className="text-amber-400 text-sm font-medium hover:text-amber-300">
              Check Inventory →
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;