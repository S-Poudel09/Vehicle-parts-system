import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// Abishek Tiwari: admin dashboard shell + nested routes (replaces "coming soon" placeholder)
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStaffPage from "./pages/admin/AdminStaffPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminVendorsPage from "./pages/admin/AdminVendorsPage";

import StaffPendingCredits from "./pages/staff/StaffPendingCredits";
import RegisterCustomer from "./pages/staff/RegisterCustomer";
import SearchCustomer from "./pages/staff/SearchCustomer";
import StaffLayout from "./layouts/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import SellParts from "./pages/staff/SellParts";
import CustomerHistory from "./pages/staff/CustomerHistory";

import "./App.css";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="vendors" element={<AdminVendorsPage />} />
          </Route>

          {/* Staff (nested routes) */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StaffDashboard />} />
            <Route path="pending-credits" element={<StaffPendingCredits />} />
            <Route path="register-customer" element={<RegisterCustomer />} />
            <Route path="search-customer" element={<SearchCustomer />} />
            <Route path="sell-parts" element={<SellParts />} />
            <Route path="customer-history" element={<CustomerHistory />} />
          </Route>

          {/* Customer */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <div>Customer Portal — coming soon</div>
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
