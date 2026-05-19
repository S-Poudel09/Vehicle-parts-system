import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// Abishek Tiwari: admin dashboard shell + nested routes (replaces "coming soon" placeholder)
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPartsPage from "./pages/admin/AdminPartsPage";
import AdminStaffPage from "./pages/admin/AdminStaffPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminVendorsPage from "./pages/admin/AdminVendorsPage";
import AdminPurchasesPage from "./pages/admin/AdminPurchasesPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";


import StaffPendingCredits from "./pages/StaffPendingCredits";
import RegisterCustomer from "./pages/RegisterCustomer";
import SearchCustomer from "./pages/SearchCustomer";

import "./App.css";

//Staff layout (navbar + nested routes)
function StaffLayout() {
  return (
    <>
      <nav className="navbar">
        <h2>Vehicle Parts System</h2>
        <div>
          <Link to="/staff">Home</Link>
          <Link to="/staff/register-customer">Register Customer</Link>
          <Link to="/staff/search-customer">Search Customer</Link>
          <Link to="/staff/pending-credits">Pending Credits</Link>
        </div>
      </nav>

      <Routes>
        {/* Default staff page */}
        <Route
          index
          element={
            <div className="page">
              <h1>Staff Dashboard</h1>
              <p>Customer registration and search module.</p>
            </div>
          }
        />
        <Route path="pending-credits" element={<StaffPendingCredits />} />
        <Route path="register-customer" element={<RegisterCustomer />} />
        <Route path="search-customer" element={<SearchCustomer />} />
      </Routes>
    </>
  );
}

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
            <Route path="parts" element={<AdminPartsPage />} />
            <Route path="purchases" element={<AdminPurchasesPage />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="vendors" element={<AdminVendorsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>


          {/* Staff (nested routes) */}
          <Route
            path="/staff/*"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <StaffLayout />
              </ProtectedRoute>
            }
          />

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
