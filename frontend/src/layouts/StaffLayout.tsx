import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../pages/staff/StaffDashboard.css";

const StaffLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="staff-dashboard">
      <aside className="staff-sidebar">
        <div>
          <div className="staff-brand">
            <div className="brand-icon">🔧</div>
            <div>
              <h2>GadiParts</h2>
              <p>STAFF PANEL</p>
            </div>
          </div>

          <nav className="staff-nav">
            <NavLink to="/staff" end>Overview</NavLink>
            <NavLink to="/staff/register-customer">Register Customer</NavLink>
            <NavLink to="/staff/search-customer">Customer Details</NavLink>
            <NavLink to="/staff/sell-parts">Sell Parts</NavLink>
            <NavLink to="/staff/customer-history">Customer History</NavLink>
            <NavLink to="/staff/pending-credits">Pending Credits</NavLink>
          </nav>
        </div>

        <button className="staff-signout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </aside>

      <main className="staff-content">
        <Outlet />
      </main>
    </div>
  );
};

export default StaffLayout;
