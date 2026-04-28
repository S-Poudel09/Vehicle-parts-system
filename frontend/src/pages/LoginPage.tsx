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
      signIn(data);

      if (data.role === 'Admin')    navigate('/admin');
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
      <div className="auth-card">
        <div className="auth-header">
          <h1>GadiParts</h1>
          <p>Sign in to access your account</p>
        </div>

        {successMessage && (
          <div className="auth-alert-success">
            {successMessage}
          </div>
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Sign up here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
