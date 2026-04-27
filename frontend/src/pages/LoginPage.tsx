import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';

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
      signIn(data);  // saves to context + sessionStorage

      // Send each role to their own dashboard
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
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8 }}>Vehicle Parts System</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Sign in to continue</p>

      {successMessage && (
        <div style={{ backgroundColor: '#e6ffe6', color: '#006600', padding: '10px', marginBottom: '20px', borderRadius: '4px', fontSize: 13 }}>
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {error && (
          <p style={{ color: 'red', fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}

        <button type="submit" disabled={loading} style={{ width: '100%', marginBottom: 16 }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p style={{ fontSize: 13, textAlign: 'center' }}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
