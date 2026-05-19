import "./StaffDashboard.css";

const StaffDashboard = () => {
  return (
    <>
      <header className="staff-header">
        <h1>Staff Dashboard</h1>
        <p>Manage customer registration, sales and vehicle records.</p>
      </header>

      <section className="welcome-card">
        <h2>Welcome back, Staff</h2>
        <p>Here are your daily staff tasks.</p>
      </section>

      <section className="staff-cards">
        {/* existing cards */}
      </section>
    </>
  );
};

export default StaffDashboard;