import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const roleDashboards = {
      admin: '/admin',
      manager: '/manager',
      cashier: '/cashier',
    };
    return <Navigate to={roleDashboards[user.role]} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;