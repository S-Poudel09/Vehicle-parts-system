import { Routes, Route, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CustomerDashboard from './CustomerDashboard';
import CustomerProfile from './CustomerProfile';
import CustomerAppointments from './CustomerAppointments';
import CustomerReviews from './CustomerReviews';
import CustomerPartRequests from './CustomerPartRequests';
import CustomerHistory from './CustomerHistory';
import '../LandingPage.css';
import './Customer.css';

export default function CustomerLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    signOut();
    navigate('/login');
  };

  return (
    <div className="customer-shell">
      {/* ── Navbar — identical structure to landing page nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <img src="/logo.png" alt="GadiParts" className="lp-nav-logo-img" />
        </div>

        <div className="lp-nav-links">
          <NavLink to="/customer" end>Dashboard</NavLink>
          <NavLink to="/customer/profile">Profile</NavLink>
          <NavLink to="/customer/appointments">Appointments</NavLink>
          <NavLink to="/customer/reviews">Reviews</NavLink>
          <NavLink to="/customer/part-requests">Parts</NavLink>
          <NavLink to="/customer/history">History</NavLink>
        </div>

        <button className="lp-btn-outline customer-logout-btn" onClick={handleLogout}>
          {user?.name ?? 'Sign out'} &nbsp;↩
        </button>
      </nav>

      <Routes>
        <Route index element={<CustomerDashboard />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="appointments" element={<CustomerAppointments />} />
        <Route path="reviews" element={<CustomerReviews />} />
        <Route path="part-requests" element={<CustomerPartRequests />} />
        <Route path="history" element={<CustomerHistory />} />
      </Routes>
    </div>
  );
}
