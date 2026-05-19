import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMySales, getMyAppointments, type Sale, type Appointment } from '../../api/customer';

const LOYALTY_THRESHOLD   = 5000;
const LOYALTY_DISCOUNT    = 0.10;
const CREDIT_OVERDUE_DAYS = 30;

const services = [
  { to: '/customer/profile',       icon: '👤', color: 'blue',   title: 'My Profile',       desc: 'View and edit your contact details and vehicles.' },
  { to: '/customer/appointments',  icon: '📅', color: 'green',  title: 'Appointments',     desc: 'Book a service slot and check appointment status.' },
  { to: '/customer/history',       icon: '🧾', color: 'amber',  title: 'Purchase History', desc: 'Full record of every purchase and service visit.' },
  { to: '/customer/part-requests', icon: '🔧', color: 'purple', title: 'Part Requests',    desc: 'Can\'t find a part? Submit a request and we\'ll source it.' },
  { to: '/customer/reviews',       icon: '⭐', color: 'red',    title: 'My Reviews',       desc: 'Rate and review your service experience.' },
  { to: '/customer/appointments',  icon: '🚗', color: 'teal',   title: 'Book Service',     desc: 'Schedule your next vehicle maintenance appointment.' },
];

function daysBetween(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [sales,        setSales]        = useState<Sale[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([getMySales(), getMyAppointments()])
      .then(([s, a]) => { setSales(s); setAppointments(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalSpent     = sales.filter(s => s.paymentStatus === 'Paid').reduce((sum, s) => sum + s.finalAmount, 0);
  const maxSingleOrder = sales.reduce((max, s) => Math.max(max, s.totalAmount), 0);
  const loyaltyOrders  = sales.filter(s => s.totalAmount >= LOYALTY_THRESHOLD && s.discount > 0);
  const overdueCredits = sales.filter(s => s.paymentStatus === 'Pending' && daysBetween(s.saleDate) >= CREDIT_OVERDUE_DAYS);
  const upcomingAppts  = appointments.filter(a =>
    a.status === 'Confirmed' || a.status === 'Pending'
  );
  const loyaltyProgress = Math.min((maxSingleOrder / LOYALTY_THRESHOLD) * 100, 100);
  const loyaltyUnlocked = maxSingleOrder >= LOYALTY_THRESHOLD;

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div className="lp" style={{ background: '#f9fafb' }}>

      {/* ══ HERO ══ */}
      <section className="lp-hero">
        <div className="lp-hero-grid">
          {/* Left */}
          <div>
            {overdueCredits.length > 0 && (
              <div className="dash-credit-banner" style={{ marginBottom: 20 }}>
                <span className="dash-credit-banner-icon">⚠️</span>
                <div className="dash-credit-banner-body">
                  <strong>{overdueCredits.length} unpaid credit{overdueCredits.length > 1 ? 's' : ''} overdue by 30+ days.</strong>
                  <span>Please settle your balance. <Link to="/customer/history" style={{ color: '#fed7aa' }}>View orders →</Link></span>
                </div>
              </div>
            )}

            <div className="lp-hero-badge">🚗 Nepal's Premier Auto Parts Platform</div>
            <h1>
              Welcome back,<br />
              <em>{user?.name ?? 'Customer'}</em>
            </h1>
            <p className="lp-hero-sub">
              Manage your vehicles, book service appointments, request hard-to-find parts,
              and track your purchase history — all in one place.
            </p>
            <div className="lp-hero-actions">
              <Link to="/customer/appointments" className="lp-hero-cta">Book Appointment →</Link>
              <Link to="/customer/history"      className="lp-hero-secondary">View History</Link>
            </div>

            {!loading && (
              <div className="lp-hero-stats">
                <div>
                  <span className="lp-hero-stat-val">{sales.length}</span>
                  <span className="lp-hero-stat-lbl">Total Orders</span>
                </div>
                <div>
                  <span className="lp-hero-stat-val">Rs. {totalSpent.toLocaleString()}</span>
                  <span className="lp-hero-stat-lbl">Total Spent</span>
                </div>
                <div>
                  <span className="lp-hero-stat-val">{upcomingAppts.length}</span>
                  <span className="lp-hero-stat-lbl">Upcoming Appts</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: floating cards */}
          <div className="lp-hero-visual">
            <div className="lp-hero-card">
              <div className="lp-hero-card-icon blue">📅</div>
              <div className="lp-hero-card-text">
                <strong>Upcoming Appointments</strong>
                <span>{upcomingAppts.length > 0 ? `${upcomingAppts.length} scheduled` : 'No upcoming bookings'}</span>
              </div>
            </div>
            <div className="lp-hero-card">
              <div className="lp-hero-card-icon green">🎁</div>
              <div className="lp-hero-card-text">
                <strong>Loyalty Discount</strong>
                <span>{loyaltyUnlocked ? '10% discount active!' : `Rs. ${Math.max(0, LOYALTY_THRESHOLD - maxSingleOrder).toLocaleString()} to unlock`}</span>
              </div>
            </div>
            <div className="lp-hero-card">
              <div className="lp-hero-card-icon amber">🔧</div>
              <div className="lp-hero-card-text">
                <strong>Part Requests</strong>
                <span>Submit a request for any hard-to-find part</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SERVICES ══ */}
      <section className="lp-section lp-features" id="services">
        <div className="lp-section-inner">
          <div className="lp-features-header">
            <span className="lp-section-label">Quick Access</span>
            <h2 className="lp-section-title">Everything you need</h2>
            <p className="lp-section-subtitle">
              From booking appointments to tracking orders, manage your vehicle care from one easy dashboard.
            </p>
          </div>
          <div className="lp-features-grid">
            {services.map(s => (
              <Link key={s.to + s.title} to={s.to} className="lp-feat-card" style={{ textDecoration: 'none' }}>
                <div className={`lp-feat-icon ${s.color}`}>{s.icon}</div>
                <h3 className="lp-feat-title">{s.title}</h3>
                <p className="lp-feat-desc">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LOYALTY ══ */}
      <section className="lp-section lp-loyalty" id="loyalty">
        <div className="lp-section-inner">
          <div className="lp-loyalty-grid">
            {/* Left */}
            <div>
              <span className="lp-section-label">Loyalty Program</span>
              <h2 className="lp-section-title">Spend more. Save more.</h2>
              <p className="lp-section-subtitle">
                Every purchase brings you closer to exclusive savings. Spend over
                Rs. {LOYALTY_THRESHOLD.toLocaleString()} in a single transaction and unlock an automatic{' '}
                {(LOYALTY_DISCOUNT * 100).toFixed(0)}% discount — no coupons needed.
              </p>
              <div className="lp-loyalty-perks">
                <div className="lp-loyalty-perk">
                  <div className="lp-loyalty-perk-icon">💰</div>
                  <div className="lp-loyalty-perk-text">
                    <strong>Automatic {(LOYALTY_DISCOUNT * 100).toFixed(0)}% Discount</strong>
                    <span>Applied instantly on purchases above Rs. {LOYALTY_THRESHOLD.toLocaleString()}.</span>
                  </div>
                </div>
                <div className="lp-loyalty-perk">
                  <div className="lp-loyalty-perk-icon">📊</div>
                  <div className="lp-loyalty-perk-text">
                    <strong>Track Your Progress</strong>
                    <span>See how close you are to your next discount below.</span>
                  </div>
                </div>
                <div className="lp-loyalty-perk">
                  <div className="lp-loyalty-perk-icon">🏆</div>
                  <div className="lp-loyalty-perk-text">
                    <strong>{loyaltyOrders.length} Discount Orders</strong>
                    <span>You've already benefited from the loyalty program{loyaltyOrders.length > 0 ? ` ${loyaltyOrders.length} time${loyaltyOrders.length > 1 ? 's' : ''}` : ''}.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: loyalty card */}
            <div className="lp-loyalty-card-wrap">
              <div className="lp-loyalty-card">
                <div className="lp-loyalty-card-header">
                  <span className="lp-loyalty-card-name">{user?.name ?? 'Member'}</span>
                  <span className="lp-loyalty-card-tier">{loyaltyUnlocked ? '⭐ Premium' : '🔵 Member'}</span>
                </div>
                <div className="lp-loyalty-bar-label">
                  <span>Rs. {Math.min(maxSingleOrder, LOYALTY_THRESHOLD).toLocaleString()} spent</span>
                  <span>Rs. {LOYALTY_THRESHOLD.toLocaleString()} goal</span>
                </div>
                <div className="lp-loyalty-bar">
                  <div className="lp-loyalty-bar-fill" style={{ width: `${loyaltyProgress}%` }} />
                </div>
                <div className="lp-loyalty-discount-badge">
                  <span className="lp-loyalty-discount-badge-icon">{loyaltyUnlocked ? '🎁' : '🎯'}</span>
                  <div className="lp-loyalty-discount-badge-text">
                    {loyaltyUnlocked ? (
                      <>
                        <strong>10% Discount Active!</strong>
                        <span>Applied automatically at checkout on qualifying orders.</span>
                      </>
                    ) : (
                      <>
                        <strong>Rs. {Math.max(0, LOYALTY_THRESHOLD - maxSingleOrder).toLocaleString()} to unlock</strong>
                        <span>Spend Rs. {LOYALTY_THRESHOLD.toLocaleString()}+ in one order to save 10%.</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ UPCOMING APPOINTMENTS ══ */}
      {!loading && (
        <section className="lp-section lp-notify" style={{ background: '#f9fafb' }}>
          <div className="lp-section-inner">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <span className="lp-section-label">Scheduled</span>
                <h2 className="lp-section-title">Upcoming Appointments</h2>
              </div>
              <Link to="/customer/appointments" className="lp-btn-primary">+ Book New</Link>
            </div>

            {upcomingAppts.length === 0 ? (
              <div className="lp-notify-item" style={{ maxWidth: 480 }}>
                <div className="lp-notify-icon blue">📅</div>
                <div className="lp-notify-body">
                  <h3>No active appointments</h3>
                  <p>You don't have any pending or confirmed appointments yet.</p>
                  <Link to="/customer/appointments" className="lp-btn-primary" style={{ marginTop: 12, display: 'inline-block' }}>Book one now →</Link>
                </div>
              </div>
            ) : (
              <>
                <div className="lp-notify-grid">
                  {upcomingAppts.slice(0, 4).map(a => (
                    <div className="lp-notify-item" key={a.id}>
                      <div className="lp-notify-icon blue">📅</div>
                      <div className="lp-notify-body">
                        <h3>{a.vehicleNumber}</h3>
                        <p>{fmtDate(a.appointmentDate)}</p>
                        <span className={`badge badge-${a.status.toLowerCase()}`} style={{ marginTop: 8, display: 'inline-block' }}>{a.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {upcomingAppts.length > 4 && (
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Link to="/customer/appointments" className="lp-btn-primary">View all {upcomingAppts.length} appointments</Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ══ CTA FOOTER ══ */}
      <section className="lp-cta">
        <div>
          <h2>Ready to book your next service?</h2>
          <p>Schedule appointments, request parts, or browse your history.</p>
          <div className="lp-cta-actions">
            <Link to="/customer/appointments" className="lp-cta-btn-white">Book an Appointment →</Link>
            <Link to="/customer/part-requests" className="lp-cta-btn-ghost">Request a Part</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
