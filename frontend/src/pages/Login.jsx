import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { KeyRound, Mail, LogIn, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import FocusTrackLogo from "../assets/focustrack-logo.png"

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [workspaceDeactivated, setWorkspaceDeactivated] = useState(false);
  const [showPassword, setShowPassword] = useState(false)

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Detect redirect from expired token or deactivated workspace
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === '1') {
      setSessionExpired(true);
    }
    if (params.get('deactivated') === '1') {
      setWorkspaceDeactivated(true);
    }
  }, [location.search]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      setAuth(response.data.accessToken, response.data.user);

      const isHR = response.data.user.role === 'HR';
      const isManagement = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(response.data.user.role);
      if (isHR) {
        navigate('/hr', { replace: true });
      } else {
        navigate(isManagement ? '/dashboard/analytics' : '/employee', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail, targetPassword) => {
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login(targetEmail, targetPassword);
      setAuth(response.data.accessToken, response.data.user);

      const isHR = response.data.user.role === 'HR';
      const isManagement = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(response.data.user.role);
      if (isHR) {
        navigate('/hr', { replace: true });
      } else {
        navigate(isManagement ? '/dashboard/analytics' : '/employee', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-canvas)', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      {/* Background decoration glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 glass-card p-8 shadow-2xl" style={{ boxShadow: '0 32px 64px rgba(0,0,0,0.10), 0 0 0 1px var(--border-subtle)' }}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={FocusTrackLogo}
              alt="FocusTrack"
              className="h-12 w-auto object-contain mx-auto"
              draggable={false}
            />
          </div>

          <p
            className="text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Smart Employee Monitoring & Workforce Analytics
          </p>
        </div>

        {/* Session Expired Banner */}
        {sessionExpired && (
          <div className="mb-5 p-4 bg-amber-950/50 border border-amber-700/60 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Session Expired</p>
              <p className="text-xs text-amber-400/80 mt-0.5">Your login session has timed out. Please sign in again to continue.</p>
            </div>
          </div>
        )}

        {/* Workspace Deactivated Banner */}
        {workspaceDeactivated && (
          <div className="mb-5 p-4 bg-red-950/50 border border-red-700/60 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-300">Workspace Deactivated</p>
              <p className="text-xs text-red-450/85 mt-0.5">Your company workspace has been deactivated. Please contact support.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800 text-red-400 rounded-xl text-xs max-h-32 overflow-y-auto">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center" style={{ color: 'var(--text-muted)' }}>
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition text-sm"
                style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-muted)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-semibold mb-2 uppercase"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>

            <div className="relative">
              <span
                className="absolute inset-y-0 left-0 pl-3 flex items-center"
                style={{ color: "var(--text-muted)" }}
              >
                <KeyRound className="w-5 h-5" />
              </span>

              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition text-sm"
                style={{
                  background: "var(--bg-canvas)",
                  border: "1px solid var(--border-muted)",
                  color: "var(--text-primary)",
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                style={{ color: "var(--text-muted)" }}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 hover:text-indigo-500 transition-colors" />
                ) : (
                  <Eye className="w-5 h-5 hover:text-indigo-500 transition-colors" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider text-xs"
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'Logging in...' : 'Sign In'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition font-semibold"
            >
              Create a new company workspace
            </button>
          </div>

          {/* Developer Fast Login Buttons */}
          <div className="border-t pt-6 mt-6 space-y-3 text-left" style={{ borderColor: 'var(--border-muted)' }}>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
              Developer Fast-Login
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin@tasktracky.com', 'superadmin123')}
                className="px-3 py-2 border text-[10px] font-semibold rounded-lg transition text-center"
                style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.22)', color: '#a5b4fc' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@acme.com', 'admin123')}
                className="px-3 py-2 border text-[10px] font-semibold rounded-lg transition text-center"
                style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.22)', color: '#6ee7b7' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}
              >
                Company Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@acme.com', 'manager123')}
                className="px-3 py-2 border text-[10px] font-semibold rounded-lg transition text-center"
                style={{ background: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.22)', color: '#93c5fd' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(96,165,250,0.08)'}
              >
                Company Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('hr@acme.com', 'hr123')}
                className="px-3 py-2 border text-[10px] font-semibold rounded-lg transition text-center"
                style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.22)', color: '#fda4af' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
              >
                HR Specialist
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('employee@acme.com', 'employee123')}
                className="col-span-2 px-3 py-2 border text-[10px] font-semibold rounded-lg transition text-center"
                style={{ background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.22)', color: '#c4b5fd' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.08)'}
              >
                Employee (Staff Member)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}




