import { Link } from 'react-router-dom';
import './LandingPage.css';

const features = [
  {
    icon: '🔧', color: 'blue',
    title: 'Parts Catalogue',
    desc: 'Browse thousands of genuine and aftermarket parts for all vehicle makes and models.',
  },
  {
    icon: '📅', color: 'green',
    title: 'Online Appointments',
    desc: 'Book a service slot online at any time and get instant confirmation.',
  },
  {
    icon: '📦', color: 'amber',
    title: 'Part Requests',
    desc: 'Can\'t find the part you need? Submit a request and we\'ll source it for you.',
  },
  {
    icon: '⭐', color: 'purple',
    title: 'Service Reviews',
    desc: 'Rate and review your experience to help us keep our quality high.',
  },
  {
    icon: '🧾', color: 'red',
    title: 'Purchase History',
    desc: 'Full transparent record of every purchase and service visit in one place.',
  },
  {
    icon: '🎁', color: 'teal',
    title: 'Loyalty Rewards',
    desc: 'Earn a 10% discount automatically when you spend over Rs. 5,000 in a single purchase.',
  },
];

const steps = [
  { num: '1', title: 'Create an Account', desc: 'Register in seconds with your email and basic details.' },
  { num: '2', title: 'Add Your Vehicle', desc: 'Register your car details so we can match the right parts.' },
  { num: '3', title: 'Book or Browse', desc: 'Schedule appointments or request parts from your dashboard.' },
  { num: '4', title: 'Track Everything', desc: 'Monitor orders, appointments, and history in real time.' },
];

export default function LandingPage() {
  return (
    <div className="lp">

      {/* ── NAVBAR ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-nav-brand">
          <img src="/logo.png" alt="GadiParts" className="lp-nav-logo-img" />
        </Link>

        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#loyalty">Loyalty</a>
          <Link to="/login" className="lp-btn-outline">Sign In</Link>
          <Link to="/signup" className="lp-btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-grid">
          {/* Left: copy */}
          <div>
            <div className="lp-hero-badge">
              🚗 Nepal's Premier Auto Parts Platform
            </div>
            <h1>
              Your vehicle.<br />
              <em>Our expertise.</em>
            </h1>
            <p className="lp-hero-sub">
              Book service appointments, request hard-to-find parts, track your purchase history,
              and earn loyalty rewards — all in one place.
            </p>
            <div className="lp-hero-actions">
              <Link to="/signup" className="lp-hero-cta">Start for Free →</Link>
              <Link to="/login" className="lp-hero-secondary">Sign In</Link>
            </div>

            <div className="lp-hero-stats">
              <div>
                <span className="lp-hero-stat-val">5,000+</span>
                <span className="lp-hero-stat-lbl">Parts in Stock</span>
              </div>
              <div>
                <span className="lp-hero-stat-val">2,400+</span>
                <span className="lp-hero-stat-lbl">Happy Customers</span>
              </div>
              <div>
                <span className="lp-hero-stat-val">99%</span>
                <span className="lp-hero-stat-lbl">Satisfaction Rate</span>
              </div>
            </div>
          </div>

          {/* Right: floating cards */}
          <div className="lp-hero-visual">
            <div className="lp-hero-card">
              <div className="lp-hero-card-icon blue">📅</div>
              <div className="lp-hero-card-text">
                <strong>Appointment Confirmed</strong>
                <span>Toyota Hilux — Service scheduled for tomorrow 10:00 AM</span>
              </div>
            </div>
            <div className="lp-hero-card">
              <div className="lp-hero-card-icon green">🎁</div>
              <div className="lp-hero-card-text">
                <strong>Loyalty Discount Applied!</strong>
                <span>10% off your order — you saved Rs. 650 today</span>
              </div>
            </div>
            <div className="lp-hero-card">
              <div className="lp-hero-card-icon amber">📦</div>
              <div className="lp-hero-card-text">
                <strong>Part Request Approved</strong>
                <span>Front brake pad for Honda Civic — ready for pickup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-section lp-features" id="features">
        <div className="lp-section-inner">
          <div className="lp-features-header">
            <span className="lp-section-label">Everything You Need</span>
            <h2 className="lp-section-title">Powerful tools for every customer</h2>
            <p className="lp-section-subtitle">
              From booking appointments to tracking orders, GadiParts gives you full control
              over your vehicle maintenance from one easy dashboard.
            </p>
          </div>

          <div className="lp-features-grid">
            {features.map(f => (
              <div className="lp-feat-card" key={f.title}>
                <div className={`lp-feat-icon ${f.color}`}>{f.icon}</div>
                <h3 className="lp-feat-title">{f.title}</h3>
                <p className="lp-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOYALTY PROGRAM ── */}
      <section className="lp-section lp-loyalty" id="loyalty">
        <div className="lp-section-inner">
          <div className="lp-loyalty-grid">
            {/* Left: copy */}
            <div>
              <span className="lp-section-label">Loyalty Program</span>
              <h2 className="lp-section-title">Spend more. Save more.</h2>
              <p className="lp-section-subtitle">
                Every purchase brings you closer to exclusive savings. Spend over
                Rs. 5,000 in a single transaction and unlock an automatic 10% discount — no coupons needed.
              </p>

              <div className="lp-loyalty-perks">
                <div className="lp-loyalty-perk">
                  <div className="lp-loyalty-perk-icon">💰</div>
                  <div className="lp-loyalty-perk-text">
                    <strong>Automatic 10% Discount</strong>
                    <span>Applied instantly at checkout on purchases above Rs. 5,000.</span>
                  </div>
                </div>
                <div className="lp-loyalty-perk">
                  <div className="lp-loyalty-perk-icon">📊</div>
                  <div className="lp-loyalty-perk-text">
                    <strong>Track Your Progress</strong>
                    <span>See how close you are to unlocking your next discount from your dashboard.</span>
                  </div>
                </div>
                <div className="lp-loyalty-perk">
                  <div className="lp-loyalty-perk-icon">🔔</div>
                  <div className="lp-loyalty-perk-text">
                    <strong>Instant Notifications</strong>
                    <span>Get email alerts for discounts applied, order updates, and reminders.</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 32 }}>
                <Link to="/signup" className="lp-hero-cta">Join & Start Saving →</Link>
              </div>
            </div>

            {/* Right: loyalty card mockup */}
            <div className="lp-loyalty-card-wrap">
              <div className="lp-loyalty-card">
                <div className="lp-loyalty-card-header">
                  <span className="lp-loyalty-card-name">GadiParts Member</span>
                  <span className="lp-loyalty-card-tier">⭐ Premium</span>
                </div>

                <div className="lp-loyalty-bar-label">
                  <span>Rs. 3,600 spent</span>
                  <span>Rs. 5,000 goal</span>
                </div>
                <div className="lp-loyalty-bar">
                  <div className="lp-loyalty-bar-fill" />
                </div>

                <div className="lp-loyalty-discount-badge">
                  <span className="lp-loyalty-discount-badge-icon">🎁</span>
                  <div className="lp-loyalty-discount-badge-text">
                    <strong>10% Discount Unlocked!</strong>
                    <span>Spend Rs. 5,000+ on any single order to save automatically</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section lp-how" id="how-it-works">
        <div className="lp-section-inner">
          <div className="lp-how-header">
            <span className="lp-section-label">Simple Process</span>
            <h2 className="lp-section-title">Up and running in minutes</h2>
            <p className="lp-section-subtitle">
              Getting started with GadiParts takes just a few steps. No technical knowledge required.
            </p>
          </div>

          <div className="lp-steps">
            {steps.map(s => (
              <div className="lp-step" key={s.num}>
                <div className="lp-step-num">{s.num}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SMART NOTIFICATIONS ── */}
      <section className="lp-section lp-notify">
        <div className="lp-section-inner">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="lp-section-label">Always Informed</span>
            <h2 className="lp-section-title">Smart notifications built in</h2>
            <p className="lp-section-subtitle" style={{ margin: '0 auto' }}>
              GadiParts keeps you and the team in sync — automatically.
            </p>
          </div>

          <div className="lp-notify-grid">
            <div className="lp-notify-item">
              <div className="lp-notify-icon orange">🔔</div>
              <div className="lp-notify-body">
                <h3>Credit Payment Reminders</h3>
                <p>
                  If you have an unpaid credit balance for more than one month, GadiParts
                  automatically sends you a friendly email reminder so nothing slips through.
                </p>
              </div>
            </div>
            <div className="lp-notify-item">
              <div className="lp-notify-icon blue">📦</div>
              <div className="lp-notify-body">
                <h3>Low Stock Alerts for Admins</h3>
                <p>
                  Our system monitors inventory in real time and instantly notifies the admin
                  team whenever any part drops below 10 units — keeping shelves stocked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="lp-cta">
        <div>
          <h2>Ready to take control of your car maintenance?</h2>
          <p>Join thousands of vehicle owners already using GadiParts.</p>
          <div className="lp-cta-actions">
            <Link to="/signup" className="lp-cta-btn-white">Create Free Account →</Link>
            <Link to="/login" className="lp-cta-btn-ghost">Sign In to Dashboard</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <Link to="/" className="lp-nav-brand" style={{ textDecoration: 'none' }}>
                <img src="/logo.png" alt="GadiParts" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
              </Link>
              <p>Nepal's trusted platform for vehicle parts, service appointments, and customer care.</p>
            </div>

            <div className="lp-footer-col">
              <h4>Customer</h4>
              <ul>
                <li><Link to="/signup">Register</Link></li>
                <li><Link to="/login">Sign In</Link></li>
                <li><a href="#loyalty">Loyalty Program</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h4>Services</h4>
              <ul>
                <li><a href="#features">Parts Catalogue</a></li>
                <li><a href="#features">Appointments</a></li>
                <li><a href="#features">Part Requests</a></li>
                <li><a href="#features">Service Reviews</a></li>
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
            <span>Built for CS6004 Application Development</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
