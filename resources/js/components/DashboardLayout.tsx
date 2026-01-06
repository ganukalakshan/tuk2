import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: 'bg-red-500', text: 'Admin' };
      case 'manager':
        return { bg: 'bg-blue-500', text: 'Manager' };
      case 'cashier':
        return { bg: 'bg-green-500', text: 'Cashier' };
      default:
        return { bg: 'bg-gray-500', text: 'User' };
    }
  };

  const roleBadge = getRoleBadge(user?.role || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/jaanNetworklogo.jpeg" 
              alt="JAAN Network" 
              className="h-12 w-auto object-contain"
            />
            <div className="border-l border-gray-300 pl-3">
              <p className="text-gray-600 text-sm font-medium tracking-wide">{title}</p>
            </div>
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-gray-50 rounded-full pl-2 pr-4 py-2">
              <div className="flex items-center space-x-3">
                <span className="text-gray-600 text-sm">Account Type:</span>
                <span className={`px-3 py-1 ${roleBadge.bg} rounded-full text-white text-xs font-semibold`}>
                  {roleBadge.text}
                </span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-sm">Logged As:</span>
                <span className="text-gray-800 text-sm font-medium">{user?.name}</span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border-2 border-white shadow">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-red-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;