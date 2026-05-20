import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CustomerLandingPage from "./pages/CustomerLandingPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import CheckEmailPage from "./pages/CheckEmailPage";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPartsPage from "./pages/admin/AdminPartsPage";
import AdminStaffPage from "./pages/admin/AdminStaffPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminVendorsPage from "./pages/admin/AdminVendorsPage";
import AdminPurchasesPage from "./pages/admin/AdminPurchasesPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import PartRequestsManagement from "./pages/admin/PartRequestsManagement";
import BookingManagement from "./pages/admin/BookingManagement";
import ServiceReviewsManagement from "./pages/admin/ServiceReviewsManagement";
import AdminActivityLogsPage from "./pages/admin/AdminActivityLogsPage";

import StaffLayout from "./layouts/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffPendingCredits from "./pages/staff/StaffPendingCredits";
import RegisterCustomer from "./pages/staff/RegisterCustomer";
import SearchCustomer from "./pages/staff/SearchCustomer";
import SellParts from "./pages/staff/SellParts";
import StaffCustomerDetailPage from "./pages/staff/StaffCustomerDetailPage";
import StaffReportsPage from "./pages/staff/StaffReportsPage";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<CustomerLandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/check-email" element={<CheckEmailPage />} />

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
            <Route path="parts" element={<AdminPartsPage />} />
            <Route path="purchases" element={<AdminPurchasesPage />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="vendors" element={<AdminVendorsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="part-requests" element={<PartRequestsManagement />} />
            <Route path="appointments" element={<BookingManagement />} />
            <Route path="reviews" element={<ServiceReviewsManagement />} />
            <Route path="activity-logs" element={<AdminActivityLogsPage />} />
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
            <Route path="customers/:customerId" element={<StaffCustomerDetailPage />} />
            <Route path="sell-parts" element={<SellParts />} />
            <Route path="reports" element={<StaffReportsPage />} />
            <Route path="appointments" element={<BookingManagement />} />
          </Route>


          {/* Customer */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
