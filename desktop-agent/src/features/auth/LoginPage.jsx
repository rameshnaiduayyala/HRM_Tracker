import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials & backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{ backgroundColor: '#f3f4f6' }}>
      <div className="card custom-card p-4 bg-white border border-2 border-dark" style={{ width: '380px', borderRadius: '0px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-block p-3 bg-danger text-white border border-2 border-dark mb-3" style={{ fontSize: '24px', fontWeight: '900', lineHeight: '1', width: '60px', height: '60px' }}>
            +
          </div>
          <h4 className="fw-black text-uppercase font-monospace text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>
            taskTracky Agent
          </h4>
          <p className="text-muted text-uppercase font-monospace small mb-0" style={{ fontSize: '10px' }}>
            Enterprise Authentication
          </p>
        </div>

        {error && (
          <div className="alert alert-danger rounded-0 border border-2 border-dark text-uppercase font-monospace py-2" role="alert" style={{ fontSize: '11px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-uppercase font-monospace text-dark fw-bold mb-1" style={{ fontSize: '10px' }}>
              Work Email
            </label>
            <input
              type="email"
              className="form-control rounded-0 border border-2 border-dark font-monospace"
              style={{ fontSize: '13px', padding: '10px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="EMPLOYEE@COMPANY.COM"
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-uppercase font-monospace text-dark fw-bold mb-1" style={{ fontSize: '10px' }}>
              Password
            </label>
            <input
              type="password"
              className="form-control rounded-0 border border-2 border-dark font-monospace"
              style={{ fontSize: '13px', padding: '10px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="mb-4 form-check">
            <input
              type="checkbox"
              className="form-check-input rounded-0 border border-2 border-dark"
              id="rememberCheck"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="form-check-label text-uppercase font-monospace text-muted fw-bold" htmlFor="rememberCheck" style={{ fontSize: '9px', userSelect: 'none' }}>
              Remember login on this device
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-danger w-100 py-3 rounded-0 border border-2 border-dark text-uppercase fw-black font-monospace"
            disabled={loading}
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
