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
    <div className="d-flex align-items-center justify-content-center vh-100 bg-dark">
      <div className="card custom-card p-4 text-light bg-black border-secondary" style={{ width: '400px', borderRadius: '15px' }}>
        <div className="text-center mb-4">
          <i className="bi bi-shield-lock-fill text-primary fs-1"></i>
          <h2 className="mt-2 fw-bold">Agent Secure Login</h2>
          <p className="text-secondary small">Sign in to begin tracking productivity</p>
        </div>
        {error && (
          <div className="alert alert-danger d-flex align-items-center py-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div>{error}</div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-secondary small">Work Email</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-light"><i className="bi bi-envelope"></i></span>
              <input
                type="email"
                className="form-control bg-dark text-light border-secondary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label text-secondary small">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-light"><i className="bi bi-key"></i></span>
              <input
                type="password"
                className="form-control bg-dark text-light border-secondary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="mb-4 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="rememberCheck"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="form-check-label text-secondary small" htmlFor="rememberCheck">
              Remember login on this device
            </label>
          </div>
          <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={loading}>
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : null}
            Authenticate & Register
          </button>
        </form>
      </div>
    </div>
  );
};
export default LoginPage;
