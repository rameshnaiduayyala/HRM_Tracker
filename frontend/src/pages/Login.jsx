import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, tenantApi } from '../services/api';
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

  // Dynamic Tenant Branding State
  const [branding, setBranding] = useState(null);

  // Detect redirect from expired token or deactivated workspace and fetch tenant branding
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === '1') {
      setSessionExpired(true);
    }
    if (params.get('deactivated') === '1') {
      setWorkspaceDeactivated(true);
    }

    // Fetch tenant branding dynamically
    const host = window.location.hostname;
    let subdomain = null;
    if (host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
      const parts = host.split('.');
      if (parts.length > 2) {
        subdomain = parts[0];
      }
    }

    tenantApi.getBranding(subdomain || 'acme')
      .then(res => {
        if (res.data) {
          setBranding(res.data);
        }
      })
      .catch(() => { });
  }, [location.search]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      setAuth(response.data.accessToken, response.data.user, response.data.refreshToken);

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
      setAuth(response.data.accessToken, response.data.user, response.data.refreshToken);

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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans bg-slate-100">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 border border-slate-100">

        {/* LEFT SIDE: 3D Character Hero Banner matching exact reference design (lg:col-span-5) */}
        <div className="lg:col-span-5 relative p-8 sm:p-10 flex flex-col justify-between overflow-hidden bg-[#5850EC] text-white">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/25">
              <img
                src={branding?.logo || FocusTrackLogo}
                alt={branding?.tenantName || "FocusTrack"}
                className="h-7 w-auto object-contain brightness-0 invert"
                onError={(e) => { e.currentTarget.src = FocusTrackLogo; }}
              />
            </div>
            <div>
              <h1 className="text-base font-black tracking-wider uppercase text-white">
                {branding?.tenantName ? branding.tenantName : 'FocusTrack'}
              </h1>
              <span className="text-[10px] font-medium text-purple-100 tracking-wider block">Enterprise Workspace</span>
            </div>
          </div>

          {/* 3D Character Illustration Area */}
          <div className="relative z-10 my-4 flex flex-col items-center text-center">
            <div className="relative w-full max-w-[240px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-purple-600/30 backdrop-blur-sm group">
              <img
                src="/avatar-hero.png"
                alt="Made for Company Owner and Admins"
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="mt-6 text-left space-y-2">
              <h2 className="text-xl font-black leading-tight text-white">
                Made for Company Owner and Admins
              </h2>
              <p className="text-xs text-purple-100/90 leading-relaxed font-medium">
                If you run an Organization, FocusTrack helps you stay on top of things from employers and employees to company business. Everything stays in one place.
              </p>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 text-[10px] text-purple-200/80 font-medium tracking-wider border-t border-white/20 pt-4 flex items-center justify-between">
            <span>© 2026 {branding?.tenantName || 'FocusTrack'}</span>
            <span className="px-2 py-0.5 rounded bg-white/15 text-white font-bold">Enterprise</span>
          </div>
        </div>

        {/* RIGHT SIDE: Smart Light Login Form (lg:col-span-7) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6 bg-white">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Welcome back! 👋
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Please provide your details to log into your account.
              </p>
            </div>

            {/* Session Expired Banner */}
            {sessionExpired && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Session Expired</strong>
                  <span className="text-[11px] text-amber-700">Your session timed out. Please sign in again.</span>
                </div>
              </div>
            )}

            {/* Workspace Deactivated Banner */}
            {workspaceDeactivated && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Workspace Deactivated</strong>
                  <span className="text-[11px] text-red-700">Please contact support or your system administrator.</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5850EC] focus:ring-1 focus:ring-[#5850EC] transition text-sm font-medium bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5850EC] focus:ring-1 focus:ring-[#5850EC] transition text-sm font-medium bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider text-xs bg-[#5850EC] hover:bg-[#4338CA] shadow-lg shadow-indigo-500/25 active:scale-[0.99]"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Logging in...' : 'Login →'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-bold text-[#5850EC] hover:underline transition"
              >
                Register
              </button>
            </div>
          </div>

          {/* Developer Fast Login Grid */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center">
              Quick Login Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin@tasktracky.com', 'superadmin123')}
                className="px-2.5 py-1.5 border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition text-center"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@acme.com', 'admin123')}
                className="px-2.5 py-1.5 border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg transition text-center"
              >
                Company Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@acme.com', 'manager123')}
                className="px-2.5 py-1.5 border border-sky-200 bg-sky-50/60 hover:bg-sky-100 text-sky-700 text-[10px] font-bold rounded-lg transition text-center"
              >
                Company Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('hr@acme.com', 'hr123')}
                className="px-2.5 py-1.5 border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg transition text-center"
              >
                HR Specialist
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('employee@acme.com', 'employee123')}
                className="col-span-2 px-2.5 py-1.5 border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg transition text-center"
              >
                Employee (Staff Member)
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}




