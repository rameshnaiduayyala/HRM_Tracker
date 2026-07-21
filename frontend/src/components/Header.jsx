import React, { useState } from 'react';
import { LogOut, User, Bell, ChevronDown, Shield, Zap, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useNavigate } from 'react-router-dom';

const ROLE_CONFIG = {
  SUPER_ADMIN: { label: 'Platform Admin',   color: 'badge-indigo',  dot: 'bg-indigo-400' },
  ADMIN:       { label: 'Company Admin',     color: 'badge-emerald', dot: 'bg-emerald-400' },
  MANAGER:     { label: 'Manager',           color: 'badge-amber',   dot: 'bg-amber-400'  },
  HR:          { label: 'HR Specialist',     color: 'badge-violet',  dot: 'bg-violet-400' },
  EMPLOYEE:    { label: 'Staff Member',      color: 'badge-rose',    dot: 'bg-rose-400'   },
};

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const navigate = useNavigate();

  const role   = user?.role || 'EMPLOYEE';
  const cfg    = ROLE_CONFIG[role] || ROLE_CONFIG.EMPLOYEE;
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || 'U'}`.toUpperCase();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="sticky top-0 z-40 w-full flex items-center justify-between px-5 py-3"
      style={{
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* ── Brand ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Animated icon mark */}
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#818cf8)', boxShadow: '0 0 14px rgba(99,102,241,0.45)' }}
          >
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-[15px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Task<span style={{ background: 'linear-gradient(90deg,#818cf8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Tracky</span>
          </h1>
        </div>

        {/* Divider + role badge */}
        <span className="w-px h-4 hidden sm:block" style={{ background: 'var(--border-muted)' }} />
        <span className={`badge ${cfg.color} hidden sm:inline-flex`}>
          <Shield className="w-2.5 h-2.5" />
          {cfg.label}
        </span>
      </div>

      {/* ── Right Controls ── */}
      <div className="flex items-center gap-2">

        {/* Notification bell */}
        <button className="relative p-2 rounded-xl transition-colors"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 pulse-glow" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
          data-tooltip={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <span className="w-px h-5 hidden sm:block" style={{ background: 'var(--border-muted)' }} />

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-all"
            style={{ background: dropdownOpen ? 'rgba(99,102,241,0.10)' : 'var(--bg-card)', border: '1px solid var(--border-muted)' }}
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black tracking-wide shadow-lg"
              style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#818cf8 100%)', boxShadow: '0 0 10px rgba(99,102,241,0.30)' }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-left leading-none">
              <span className="block text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.firstName} {user?.lastName}</span>
              <span className="block text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email}</span>
            </div>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
          </button>

          {dropdownOpen && (
            <>
              <div onClick={() => setDropdownOpen(false)} className="fixed inset-0 z-10" />
              <div className="absolute right-0 mt-2 w-56 z-20 animate-fade-up"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: '14px', boxShadow: '0 24px 48px rgba(0,0,0,0.15), 0 0 0 1px var(--border-subtle)' }}
              >
                {/* User info header */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-black"
                      style={{ background: 'linear-gradient(135deg,#4f46e5,#818cf8)' }}
                    >{initials}</div>
                    <div>
                      <span className="block text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{user?.firstName} {user?.lastName}</span>
                      <span className={`badge ${cfg.color} mt-0.5`}><span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}</span>
                    </div>
                  </div>
                  <span className="block text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</span>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-card-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <User className="w-3.5 h-3.5" /> My Profile
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors text-rose-400"
                    onMouseEnter={e => e.currentTarget.style.background='rgba(244,63,94,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}




