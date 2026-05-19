import { BrowserRouter, Routes, Route, Navigate, Link, NavLink } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LandingPage from "./pages/LandingPage";

import StaffPendingCredits from "./pages/StaffPendingCredits";
import RegisterCustomer from "./pages/RegisterCustomer";
import SearchCustomer from "./pages/SearchCustomer";

import CustomerLayout from "./pages/customer/CustomerLayout";

import "./App.css";

//Staff layout (navbar + nested routes)
function StaffLayout() {
  return (
    <>
      <nav className="navbar">
        <Link to="/staff" className="navbar-brand">
          <img src="/logo.png" alt="GadiParts" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
        </Link>
        <div className="navbar-links">
          <NavLink to="/staff" end>Home</NavLink>
          <NavLink to="/staff/register-customer">Register Customer</NavLink>
          <NavLink to="/staff/search-customer">Search Customer</NavLink>
          <NavLink to="/staff/pending-credits">Pending Credits</NavLink>
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <div>Admin Dashboard — coming soon</div>
              </ProtectedRoute>
            }
          />

          {/* Staff (nested routes) */}
          <Route
            path="/staff/*"
            element={
              <ProtectedRoute allowedRoles={["Staff"]}>
                <StaffLayout />
              </ProtectedRoute>
            }
          />

          {/* Customer (nested routes) */}
          <Route
            path="/customer/*"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;