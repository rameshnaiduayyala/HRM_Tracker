import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { KeyRound, Mail, LogIn, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [workspaceDeactivated, setWorkspaceDeactivated] = useState(false);

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

      <div className="w-full max-w-md relative z-10 glass-card p-8 shadow-2xl" style={{ boxShadow: '0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)' }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">
            Task<span style={{ background: 'linear-gradient(90deg,#818cf8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Tracky</span>
          </h1>
          <p className="text-sm text-gray-400">
            Sign in to your workplace portal
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
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1f2937] border border-gray-800 text-white rounded-xl focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <KeyRound className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1f2937] border border-gray-800 text-white rounded-xl focus:outline-none focus:border-indigo-500 transition text-sm"
              />
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
          <div className="border-t border-gray-800/85 pt-6 mt-6 space-y-3 text-left">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">
              Developer Fast-Login
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin@tasktracky.com', 'superadmin123')}
                className="px-3 py-2 bg-indigo-955/40 hover:bg-indigo-900/40 border border-indigo-900/50 text-[10px] font-semibold rounded-lg text-indigo-300 transition text-center"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@acme.com', 'admin123')}
                className="px-3 py-2 bg-emerald-955/40 hover:bg-emerald-900/40 border border-emerald-900/50 text-[10px] font-semibold rounded-lg text-emerald-300 transition text-center"
              >
                Company Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@acme.com', 'manager123')}
                className="px-3 py-2 bg-blue-955/40 hover:bg-blue-900/40 border border-blue-900/50 text-[10px] font-semibold rounded-lg text-blue-300 transition text-center"
              >
                Company Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('hr@acme.com', 'hr123')}
                className="px-3 py-2 bg-pink-955/40 hover:bg-pink-900/40 border border-pink-900/50 text-[10px] font-semibold rounded-lg text-pink-300 transition text-center"
              >
                HR Specialist
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('employee@acme.com', 'employee123')}
                className="col-span-2 px-3 py-2 bg-purple-955/40 hover:bg-purple-900/40 border border-purple-900/50 text-[10px] font-semibold rounded-lg text-purple-300 transition text-center"
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
