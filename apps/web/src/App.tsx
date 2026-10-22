import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout } from "./layouts/PublicLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Public Pages
import { HomePage } from "./pages/HomePage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { SchoolsPage } from "./pages/SchoolsPage";
import { SchoolDetailsPage } from "./pages/SchoolDetailsPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderTrackPage } from "./pages/OrderTrackPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import {
  PrivacyPolicyPage,
  TermsPage,
  ShippingPolicyPage,
  ReturnPolicyPage,
} from "./pages/LegalPages";

// Portals
import { CustomerDashboard } from "./pages/CustomerDashboard";
import { SchoolDashboard } from "./pages/SchoolDashboard";
import { FranchiseDashboard } from "./pages/FranchiseDashboard";
import { TailorDashboard } from "./pages/TailorDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { SuperAdminDashboard } from "./pages/SuperAdminDashboard";
import { SuperAdminImagesPage } from "./pages/SuperAdminImagesPage";

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Storefront Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:productSlug" element={<ProductDetailsPage />} />
        <Route path="/schools" element={<SchoolsPage />} />
        <Route path="/schools/:schoolSlug" element={<SchoolDetailsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders/track" element={<OrderTrackPage />} />
        <Route path="/orders/:orderId/track" element={<OrderTrackPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/shipping" element={<ShippingPolicyPage />} />
        <Route path="/returns" element={<ReturnPolicyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Portal Login Aliases */}
        <Route path="/school/login" element={<LoginPage />} />
        <Route path="/franchise/login" element={<LoginPage />} />
        <Route path="/tailor/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/super-admin/login" element={<LoginPage />} />
      </Route>

      {/* Customer Portal */}
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "ADMIN", "SUPER_ADMIN"]}>
            <DashboardLayout>
              <CustomerDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* School Portal */}
      <Route
        path="/school/dashboard"
        element={
          <ProtectedRoute allowedRoles={["SCHOOL_ADMIN", "ADMIN", "SUPER_ADMIN"]}>
            <DashboardLayout>
              <SchoolDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Franchise Portal */}
      <Route
        path="/franchise/dashboard"
        element={
          <ProtectedRoute allowedRoles={["FRANCHISE_ADMIN", "ADMIN", "SUPER_ADMIN"]}>
            <DashboardLayout>
              <FranchiseDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Tailor Portal */}
      <Route
        path="/tailor/dashboard"
        element={
          <ProtectedRoute allowedRoles={["TAILOR", "ADMIN", "SUPER_ADMIN"]}>
            <DashboardLayout>
              <TailorDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Operations Admin Panel */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/admin/customers" element={<Navigate to="/admin/dashboard?tab=customers" replace />} />
      <Route path="/admin/schools" element={<Navigate to="/admin/dashboard?tab=schools" replace />} />
      <Route path="/admin/approvals" element={<Navigate to="/admin/dashboard?tab=approvals" replace />} />
      <Route path="/admin/orders" element={<Navigate to="/admin/dashboard?tab=orders" replace />} />

      {/* Super Admin Panel */}
      <Route
        path="/super-admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <DashboardLayout>
              <SuperAdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/super-admin/users" element={<Navigate to="/super-admin/dashboard?tab=users" replace />} />
      <Route path="/super-admin/financial-settings" element={<Navigate to="/super-admin/dashboard?tab=financials" replace />} />
      <Route path="/super-admin/audit-logs" element={<Navigate to="/super-admin/dashboard?tab=audit" replace />} />

      {/* Mandatory Super Admin Product Image Studio */}
      <Route
        path="/super-admin/product-images"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
            <DashboardLayout>
              <SuperAdminImagesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
