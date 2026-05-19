import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPartsPage from "./pages/admin/AdminPartsPage";
import AdminStaffPage from "./pages/admin/AdminStaffPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminVendorsPage from "./pages/admin/AdminVendorsPage";
import AdminPurchasesPage from "./pages/admin/AdminPurchasesPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";


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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="parts" element={<AdminPartsPage />} />
            <Route path="purchases" element={<AdminPurchasesPage />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="vendors" element={<AdminVendorsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
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

          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <div>Customer Portal — coming soon</div>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;