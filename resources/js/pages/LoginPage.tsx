import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, BarChart3, CreditCard, LogIn } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated - cashier goes directly to POS
  if (user) {
    if (user.role === 'cashier') {
      return <Navigate to="/pos-billing" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password, remember);
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200 flex">
      {/* Desktop Left Column - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
        <div className="max-w-lg">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <img 
              src="/jaanNetworklogo.jpeg" 
              alt="JAAN Network" 
              className="h-16 w-auto object-contain"
            />
          </div>

          {/* Tagline */}
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            A cafe and restaurant POS system
          </p>

          {/* Role Cards */}
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 shadow">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-400 rounded-lg flex items-center justify-center mr-4">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Admin</h3>
                <p className="text-stone-400 text-sm">Controls staff, menu, reports</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 shadow">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Manager</h3>
                <p className="text-stone-400 text-sm">Handles shifts, inventory, live orders</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-white rounded-xl border border-gray-200 shadow">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-400 rounded-lg flex items-center justify-center mr-4">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Cashier</h3>
                <p className="text-stone-400 text-sm">Fast checkout and table payments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Status Pill */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 border border-green-200 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-700 text-xs font-medium">Online – Café POS</span>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <img 
                src="/jaanNetworklogo.jpeg" 
                alt="JAAN Network" 
                className="h-12 w-auto object-contain"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Sign in to your shift
            </h2>

            {error && (
              <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-red-700 text-sm text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 text-yellow-500 bg-gray-100 border-gray-300 rounded focus:ring-yellow-400 focus:ring-2"
                />
                <label htmlFor="remember" className="ml-3 text-stone-300 text-sm">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 hover:brightness-110 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Log in</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-gray-500 text-xs text-center mt-6 leading-relaxed">
              You'll be redirected to your dashboard based on your role: admin, manager, or cashier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;