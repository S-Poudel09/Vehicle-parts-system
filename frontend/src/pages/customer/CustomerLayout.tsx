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

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div className="lp-nav-brand">
                <img src="/logo.png" alt="GadiParts" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
              </div>
              <p>Nepal's trusted platform for vehicle parts, service appointments, and customer care.</p>
            </div>

            <div className="lp-footer-col">
              <h4>My Account</h4>
              <ul>
                <li><NavLink to="/customer/profile">Profile</NavLink></li>
                <li><NavLink to="/customer/history">Purchase History</NavLink></li>
                <li><NavLink to="/customer/reviews">My Reviews</NavLink></li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h4>Services</h4>
              <ul>
                <li><NavLink to="/customer/appointments">Appointments</NavLink></li>
                <li><NavLink to="/customer/part-requests">Part Requests</NavLink></li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h4>Contact</h4>
              <ul>
                <li><a href="mailto:support@gadiparts.com.np">support@gadiparts.com.np</a></li>
                <li><a href="tel:+97714000000">+977 1-4000000</a></li>
                <li><a href="#">Kathmandu, Nepal</a></li>
              </ul>
            </div>
          </div>

          <hr className="lp-footer-divider" />

          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} GadiParts. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
