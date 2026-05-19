import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import './Auth.css';

export default function SignupPage() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response.data || 'User with this email already exists.');
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left branding panel */}
      <div className="auth-brand">
        <div className="auth-brand-bg-text">PARTS</div>
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <img src="/logo.png" alt="GadiParts" style={{ height: 52, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <h2 className="auth-brand-headline">
            Drive with<br /><span>confidence.</span>
          </h2>
          <p className="auth-brand-sub">
            Join thousands of vehicle owners who trust GadiParts for genuine parts and expert service.
          </p>
          <div className="auth-brand-stats">
            <div>
              <span className="auth-brand-stat-val">Free</span>
              <span className="auth-brand-stat-lbl">Registration</span>
            </div>
            <div>
              <span className="auth-brand-stat-val">24/7</span>
              <span className="auth-brand-stat-lbl">Online booking</span>
            </div>
            <div>
              <span className="auth-brand-stat-val">Fast</span>
              <span className="auth-brand-stat-lbl">Delivery</span>
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
            <h1>Create account</h1>
            <p>Join us and manage your vehicles online</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

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
                minLength={6}
              />
            </div>

            {error && <div className="auth-alert-error">{error}</div>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <div className="auth-footer">
              Already have an account? <Link to="/login">Sign in here</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
