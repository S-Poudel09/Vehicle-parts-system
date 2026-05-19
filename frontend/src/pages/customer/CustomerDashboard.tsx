import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMySales, getMyAppointments, type Sale, type Appointment } from '../../api/customer';

const LOYALTY_THRESHOLD   = 5000;
const LOYALTY_DISCOUNT    = 0.10;
const CREDIT_OVERDUE_DAYS = 30;

const categories = [
  { to: '/customer/profile',       icon: '👤', color: 'blue',   title: 'My Profile'       },
  { to: '/customer/appointments',  icon: '📅', color: 'green',  title: 'Appointments'     },
  { to: '/customer/history',       icon: '🧾', color: 'amber',  title: 'Purchase History' },
  { to: '/customer/part-requests', icon: '🔧', color: 'purple', title: 'Part Requests'    },
  { to: '/customer/reviews',       icon: '⭐', color: 'red',    title: 'My Reviews'       },
];

function daysBetween(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
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
    (a.status === 'Confirmed' || a.status === 'Pending') && new Date(a.appointmentDate) > new Date()
  );

  const loyaltyProgress = Math.min((maxSingleOrder / LOYALTY_THRESHOLD) * 100, 100);
  const loyaltyUnlocked = maxSingleOrder >= LOYALTY_THRESHOLD;

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div className="customer-page">

      {/* ── Overdue credit banner ── */}
      {overdueCredits.length > 0 && (
        <div className="dash-credit-banner">
          <span className="dash-credit-banner-icon">⚠️</span>
          <div className="dash-credit-banner-body">
            <strong>
              You have {overdueCredits.length} unpaid credit{overdueCredits.length > 1 ? 's' : ''} overdue by more than 30 days.
            </strong>
            <span>
              Please settle your balance to avoid service restrictions.{' '}
              <Link to="/customer/history">View outstanding orders →</Link>
            </span>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="cp-hero">
        <div className="cp-hero-content">
          <div className="cp-hero-badge">🚗 Nepal's Premier Auto Parts Platform</div>
          <h1>
            Welcome back,<br /><em>{user?.name ?? 'Customer'}</em>
          </h1>
          <p>Manage your vehicles, book service appointments, request parts, and track your history — all in one place.</p>
          <div className="cp-hero-actions">
            <Link to="/customer/appointments" className="cp-hero-btn">Book Appointment →</Link>
            <Link to="/customer/history"      className="cp-hero-btn-ghost">View History</Link>
          </div>
        </div>

        <div className="cp-hero-visual">
          <div className="cp-hero-card">
            <div className="cp-hero-card-icon blue">📅</div>
            <div>
              <strong>Upcoming Appointments</strong>
              <span>{upcomingAppts.length} scheduled</span>
            </div>
          </div>
          <div className="cp-hero-card">
            <div className="cp-hero-card-icon green">🎁</div>
            <div>
              <strong>Loyalty Discount</strong>
              <span>
                {loyaltyUnlocked
                  ? '10% discount active!'
                  : `Rs. ${Math.max(0, LOYALTY_THRESHOLD - maxSingleOrder).toLocaleString()} to unlock`}
              </span>
            </div>
          </div>
          <div className="cp-hero-card">
            <div className="cp-hero-card-icon amber">🧾</div>
            <div>
              <strong>Total Spent</strong>
              <span>Rs. {totalSpent.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {!loading && (
        <div className="cp-stats">
          <div className="cp-stat">
            <div className="cp-stat-icon blue">📦</div>
            <div>
              <div className="cp-stat-val">{sales.length}</div>
              <div className="cp-stat-lbl">Total Orders</div>
            </div>
          </div>
          <div className="cp-stat">
            <div className="cp-stat-icon green">💰</div>
            <div>
              <div className="cp-stat-val">Rs. {totalSpent.toLocaleString()}</div>
              <div className="cp-stat-lbl">Total Spent</div>
            </div>
          </div>
          <div className="cp-stat">
            <div className="cp-stat-icon amber">📅</div>
            <div>
              <div className="cp-stat-val">{upcomingAppts.length}</div>
              <div className="cp-stat-lbl">Upcoming Appointments</div>
            </div>
          </div>
          <div className="cp-stat">
            <div className="cp-stat-icon purple">🎁</div>
            <div>
              <div className="cp-stat-val">{loyaltyOrders.length}</div>
              <div className="cp-stat-lbl">Discount Orders</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Service categories ── */}
      <div className="cp-section-header">
        <div>
          <div className="cp-section-label">Quick Access</div>
          <h2 className="cp-section-title">Our Services</h2>
        </div>
      </div>

      <div className="cp-categories">
        {categories.map(c => (
          <Link key={c.to} to={c.to} className="cp-cat-card">
            <div className={`cp-cat-icon ${c.color}`}>{c.icon}</div>
            <span className="cp-cat-title">{c.title}</span>
          </Link>
        ))}
      </div>

      {/* ── Bottom: loyalty + upcoming appointments ── */}
      {!loading && (
        <div className="cp-bottom">

          <div className="section-card">
            <div className="dash-loyalty-header">
              <span className="dash-loyalty-title">🎁 Loyalty Program</span>
              {loyaltyUnlocked && <span className="badge badge-completed">10% Active</span>}
            </div>
            <p className="dash-loyalty-desc">
              Spend <strong>Rs. {LOYALTY_THRESHOLD.toLocaleString()}+</strong> in a single purchase
              to automatically receive a <strong>{(LOYALTY_DISCOUNT * 100).toFixed(0)}% discount</strong>.
            </p>
            <div className="dash-loyalty-bar-labels">
              <span>Rs. {Math.min(maxSingleOrder, LOYALTY_THRESHOLD).toLocaleString()}</span>
              <span>Rs. {LOYALTY_THRESHOLD.toLocaleString()} goal</span>
            </div>
            <div className="dash-loyalty-bar">
              <div className="dash-loyalty-bar-fill" style={{ width: `${loyaltyProgress}%` }} />
            </div>
            {loyaltyUnlocked ? (
              <div className="dash-loyalty-unlocked">
                ✅ Discount applied automatically on eligible purchases.
              </div>
            ) : (
              <div className="dash-loyalty-hint">
                Spend <strong>Rs. {Math.max(0, LOYALTY_THRESHOLD - maxSingleOrder).toLocaleString()}</strong> more in a single order to unlock.
              </div>
            )}
          </div>

          <div className="section-card">
            <div className="dash-loyalty-header">
              <span className="dash-loyalty-title">📅 Upcoming Appointments</span>
              <Link to="/customer/appointments" className="cp-section-link">View all →</Link>
            </div>
            {upcomingAppts.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <p>No upcoming appointments.</p>
                <Link to="/customer/appointments" style={{ color: '#2563eb', fontSize: 14, marginTop: 8, display: 'inline-block' }}>
                  Book one now →
                </Link>
              </div>
            ) : (
              <div className="item-list">
                {upcomingAppts.slice(0, 3).map(a => (
                  <div className="item-card" key={a.id}>
                    <div className="item-card-body">
                      <p className="item-card-title">{a.vehicleNumber}</p>
                      <p className="item-card-meta">{fmtDate(a.appointmentDate)}</p>
                    </div>
                    <span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
