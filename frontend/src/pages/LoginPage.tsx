import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const { signIn } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const successMessage = location.state?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      signIn(data);

      if (data.role === 'Admin')      navigate('/admin');
      else if (data.role === 'Staff') navigate('/staff');
      else                            navigate('/customer');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left branding panel */}
      <div className="auth-brand">
        <div className="auth-brand-bg-text">GADI</div>
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <img src="/logo.png" alt="GadiParts" style={{ height: 52, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <h2 className="auth-brand-headline">
            Your vehicle,<br /><span>our expertise.</span>
          </h2>
          <p className="auth-brand-sub">
            Genuine parts, professional service, and complete transparency — all in one place.
          </p>
          <div className="auth-brand-stats">
            <div>
              <span className="auth-brand-stat-val">5,000+</span>
              <span className="auth-brand-stat-lbl">Parts in stock</span>
            </div>
            <div>
              <span className="auth-brand-stat-val">1,200+</span>
              <span className="auth-brand-stat-lbl">Happy customers</span>
            </div>
            <div>
              <span className="auth-brand-stat-val">98%</span>
              <span className="auth-brand-stat-lbl">Satisfaction</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-header-logo">
              <img src="/logo.png" alt="GadiParts" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            </div>
            <h1>Welcome back</h1>
            <p>Sign in to access your account</p>
          </div>

          {successMessage && (
            <div className="auth-alert-success">{successMessage}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="auth-form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="auth-alert-error">{error}</div>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="auth-footer">
              Don't have an account? <Link to="/signup">Sign up here</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
