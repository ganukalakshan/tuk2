import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/AdminDashboard';
import CustomerPage from '../pages/customer/CustomerPage';
import SupplierPage from '../pages/suppliers/SupplierPage';
import MaterialPage from '../pages/material/MaterialPage';

import MeasurementUnitPage from '../pages/units/MeasurementUnitPage';
import CategoryPage from '../pages/categories/CategoryPage';

import POSBilling from '../pages/posbilling/POSBilling';

import CompanyInfoPage from '../pages/company/CompanyInfoPage';
import MenuItemPage from '../pages/menuItems/MenuItemPage';
import MenuCategoryPage from '../pages/menucategory/MenuCategoryPage';
import PurchaseRequestPage from '../pages/purchases/PurchaseRequestPage';
import PurchaseOrderPage from '../pages/purchase-orders/PurchaseOrderPage';
import GRNPage from '../pages/grn/GRNPage';
import { ServiceChargePage } from '../pages/service-charge';
import RecipesPage from '../pages/recipes/RecipesPage';
import EmployerPage from '../pages/employers/EmployerPage';
import { FoodStorePage } from '../pages/food-store';
import { GrnStorePage } from '../pages/grn-store';
import { StockTransferPage, StoreView } from '../pages/stock-transfer';
import ReportsPage from '../pages/reports/ReportsPage';
import StockTransferReport from '../pages/reports/StockTransferReport';
import WastageReport from '../pages/reports/WastageReport';
import PurchaseReport from '../pages/reports/PurchaseReport';
import InventoryReport from '../pages/reports/InventoryReport';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import FoodStoreForm from '../pages/foodstore/FoodStoreForm';
import FoodStoreList from '../pages/foodstore/FoodStoreList';
import WastagePage from '../pages/wastage/WastagePage';
import WastageForm from '../pages/wastage/WastageForm';


const App: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-zinc-900 to-stone-800 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-lg font-medium">Loading JPoS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-slate-200">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['admin', 'manager', 'cashier']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Legacy route redirects */}
        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
        <Route path="/manager" element={<Navigate to="/dashboard" replace />} />
        <Route path="/cashier" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/pos-billing"
          element={
            <ProtectedRoute roles={['cashier','admin','manager']}>
              <POSBilling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <CustomerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <SupplierPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <MaterialPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/measurement-units"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <MeasurementUnitPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <CategoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu-items"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <MenuItemPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipes"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <RecipesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu-categories"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <MenuCategoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-requests"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <PurchaseRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company-info"
          element={
            <ProtectedRoute roles={['admin']}>
              <CompanyInfoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employers"
          element={
            <ProtectedRoute roles={['admin']}>
              <EmployerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <PurchaseOrderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grns"
          element={
            <ProtectedRoute roles={['admin', 'manager', 'cashier']}>
              <GRNPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/service-charge"
          element={
            <ProtectedRoute roles={['admin']}>
              <ServiceChargePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/food-store"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <FoodStoreList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/food-store/add"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <FoodStoreForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wastage"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <WastagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wastage/add"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <WastageForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grn-store"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <GrnStorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock-transfer"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <StockTransferPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock-transfer/store/:store"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <StoreView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/stock-transfer"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <StockTransferReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/wastage"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <WastageReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/purchase"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <PurchaseReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/inventory"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <InventoryReport />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;