import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingCart,
  FileText,
  ClipboardList,
  Package,
  Box,
  BarChart3,
  ArrowRightLeft,
  Users,
  Truck,
  Ruler,
  Grid3X3,
  Building2,
  UserCog,
  History,
  Trash2,
  Layers,
  BookOpen,
  ChefHat,
  Percent,
  Store,
  ShoppingBag
} from 'lucide-react';

// Dashboard Card Data
const dashboardCards = [
  {
    id: 'pos-billing',
    title: 'POS Billing',
    description: 'Quick billing and payment processing',
    icon: ShoppingCart,
    bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
    hoverColor: 'hover:shadow-green-500/40',
    route: '/pos-billing',
  },
  {
    id: 'purchase-request',
    title: 'Purchase Request',
    description: 'Create and manage purchase requests',
    icon: FileText,
    bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
    hoverColor: 'hover:shadow-teal-500/40',
    route: '/purchase-requests',
  },
  {
    id: 'purchase-order',
    title: 'Purchase Order',
    description: 'Manage purchase orders efficiently',
    icon: ClipboardList,
    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
    hoverColor: 'hover:shadow-blue-500/40',
    route: '/purchase-orders',
  },
  {
    id: 'available-grn',
    title: 'Available GRN',
    description: 'Goods received notes management',
    icon: Package,
    bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    hoverColor: 'hover:shadow-indigo-500/40',
    route: '/grns',
  },
  {
    id: 'grn-store',
    title: 'GRN Store',
    description: 'Materials from Available GRN by category',
    icon: Store,
    bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
    hoverColor: 'hover:shadow-purple-500/40',
    route: '/grn-store',
  },
  {
    id: 'material',
    title: 'Material',
    description: 'Manage shop materials and inventory',
    icon: Layers,
    bgColor: 'bg-gradient-to-br from-sky-500 to-sky-600',
    hoverColor: 'hover:shadow-sky-500/40',
    route: '/materials',
  },
  {
    id: 'menu-categories',
    title: 'Menu Categories',
    description: 'Organize menu items by categories',
    icon: BookOpen,
    bgColor: 'bg-gradient-to-br from-lime-500 to-lime-600',
    hoverColor: 'hover:shadow-lime-500/40',
    route: '/menu-categories',
  },
  {
    id: 'product',
    title: 'Product',
    description: 'Manage menu items and pricing',
    icon: Box,
    bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
    hoverColor: 'hover:shadow-red-500/40',
    route: '/menu-items',
  },
  {
    id: 'recipe-creation',
    title: 'Recipe Creation',
    description: 'Create and manage product recipes',
    icon: ChefHat,
    bgColor: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600',
    hoverColor: 'hover:shadow-fuchsia-500/40',
    route: '/recipes',
  },
  {
    id: 'report',
    title: 'Report',
    description: 'Sales and inventory insights',
    icon: BarChart3,
    bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
    hoverColor: 'hover:shadow-orange-500/40',
    route: '/reports',
  },
  {
    id: 'stock-transfer',
    title: 'Stock Transfer',
    description: 'Transfer materials between stores',
    icon: ArrowRightLeft,
    bgColor: 'bg-gradient-to-br from-violet-500 to-violet-600',
    hoverColor: 'hover:shadow-violet-500/40',
    route: '/stock-transfer',
  },
  {
    id: 'customer',
    title: 'Customer',
    description: 'Customer profiles and loyalty programs',
    icon: Users,
    bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
    hoverColor: 'hover:shadow-purple-500/40',
    route: '/customers',
  },
  {
    id: 'supplier',
    title: 'Supplier',
    description: 'Manage suppliers and purchase orders',
    icon: Truck,
    bgColor: 'bg-gradient-to-br from-amber-600 to-amber-700',
    hoverColor: 'hover:shadow-amber-600/40',
    route: '/suppliers',
  },
  {
    id: 'units',
    title: 'Units',
    description: 'Manage product unit options',
    icon: Ruler,
    bgColor: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    hoverColor: 'hover:shadow-cyan-500/40',
    route: '/measurement-units',
  },
  {
    id: 'category',
    title: 'Category',
    description: 'Organize products efficiently',
    icon: Grid3X3,
    bgColor: 'bg-gradient-to-br from-pink-500 to-pink-600',
    hoverColor: 'hover:shadow-pink-500/40',
    route: '/categories',
  },
  {
    id: 'company-info',
    title: 'Company Info',
    description: 'Business details and settings',
    icon: Building2,
    bgColor: 'bg-gradient-to-br from-slate-600 to-slate-700',
    hoverColor: 'hover:shadow-slate-600/40',
    route: '/company-info',
  },
  {
    id: 'employer',
    title: 'Employer',
    description: 'Staff management and roles',
    icon: UserCog,
    bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    hoverColor: 'hover:shadow-emerald-500/40',
    route: '/employers',
  },
  {
    id: 'order-history',
    title: 'Order History',
    description: 'View past orders and transactions',
    icon: History,
    bgColor: 'bg-gradient-to-br from-rose-500 to-rose-600',
    hoverColor: 'hover:shadow-rose-500/40',
    route: null,
  },
  {
    id: 'wastage-shortage',
    title: 'Wastage & Shortage',
    description: 'Track wastage and stock shortages',
    icon: Trash2,
    bgColor: 'bg-gradient-to-br from-red-600 to-red-700',
    hoverColor: 'hover:shadow-red-600/40',
    route: '/wastage',
  },
  {
    id: 'service-charge',
    title: 'Service Charge',
    description: 'Manage service charge rates and settings',
    icon: Percent,
    bgColor: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
    hoverColor: 'hover:shadow-yellow-500/40',
    route: '/service-charge',
  },
  {
    id: 'food-store',
    title: 'Food Store',
    description: 'Manage food inventory and stock levels',
    icon: ShoppingBag,
    bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
    hoverColor: 'hover:shadow-orange-500/40',
    route: '/food-store',
  },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCardClick = (route: string | null) => {
    if (route) {
      navigate(route);
    }
  };

  // Filter cards based on user role
  const getFilteredCards = () => {
    if (user?.role === 'cashier') {
      // Cashier can only see POS Billing
      return dashboardCards.filter(card => card.id === 'pos-billing');
    }
    if (user?.role === 'manager') {
      // Manager can see most cards except admin-only ones
      const managerExcluded = ['company-info', 'employer'];
      return dashboardCards.filter(card => !managerExcluded.includes(card.id));
    }
    // Admin can see all cards
    return dashboardCards;
  };

  const filteredCards = getFilteredCards();

  // Get dashboard title based on role
  const getDashboardTitle = () => {
    if (user?.role === 'cashier') return 'Cashier Dashboard';
    if (user?.role === 'manager') return 'Manager Dashboard';
    return 'Admin Dashboard';
  };

  return (
    <DashboardLayout title={getDashboardTitle()}>
      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.route)}
              className={`${card.bgColor} ${card.hoverColor} rounded-2xl p-6 cursor-pointer 
                         transform transition-all duration-300 ease-out
                         hover:scale-105 hover:shadow-2xl
                         group relative overflow-hidden`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white rounded-full"></div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white rounded-full"></div>
              </div>

              {/* Icon Container */}
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center
                               transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <IconComponent className="w-8 h-8 text-gray-700" strokeWidth={1.5} />
                </div>
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-white text-lg font-bold mb-2 tracking-wide uppercase">
                  {card.title}
                </h3>
                <p className="text-white/80 text-sm font-medium leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Hover Arrow Indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 
                             transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;