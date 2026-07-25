import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTracking } from '../contexts/TrackingContext';
import { invoke } from '@tauri-apps/api/core';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const { shiftActive, isPaused } = useTracking();
  const [sysInfo, setSysInfo] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchSysInfo = async () => {
      try {
        const info = await invoke('get_system_info');
        setSysInfo(info);
      } catch (_) {}
    };
    fetchSysInfo();
  }, []);

  // Handle clicking outside the profile dropdown to close it
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const statusClass = shiftActive ? (isPaused ? 'paused' : 'working') : 'offline';
  const statusLabel = shiftActive ? (isPaused ? 'Paused' : 'Active') : 'Offline';

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'TT';

  return (
    <div className="app-shell">
      {/* ── Left Sidebar ── */}
      <aside className="sidebar">
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="brand-icon">
            <i className="bi bi-briefcase-fill" style={{ fontSize: '14px' }} />
          </div>
          <div>
            <div className="brand-name" style={{ lineHeight: '1.1' }}>WorkforcePro</div>
            <div className="brand-version" style={{ fontSize: '9px', padding: '1px 4px', display: 'inline-block', marginTop: '2px', border: 'none', background: '#f0ecf9', color: 'var(--primary)', fontWeight: 'bold' }}>
              Enterprise Tier
            </div>
          </div>
        </div>

        {/* Sidebar Navigation links */}
        <nav className="sidebar-nav">
          <NavLink to="/" className="sidebar-link" end>
            <i className="bi bi-speedometer2" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/tasks" className="sidebar-link">
            <i className="bi bi-kanban" />
            <span>Tasks</span>
          </NavLink>
          <NavLink to="/settings" className="sidebar-link">
            <i className="bi bi-gear" />
            <span>Settings</span>
          </NavLink>
        </nav>
      </aside>

      {/* ── Main Content Container ── */}
      <div className="main-container">
        {/* Content Header */}
        <header className="content-header" style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left Side: Branding Title & Smart Connection Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
              <div className="content-header-title" style={{ margin: 0 }}>
                {user ? `${user.firstName} ${user.lastName}` : 'Workforce Portal'}
              </div>
              {user && (
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                  {user.designation || 'EMPLOYEE'}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--status-working)', fontWeight: '600', background: 'var(--status-working-glow)', padding: '2px 8px', borderRadius: '12px' }}>
              <i className="bi bi-cloud-check-fill" style={{ fontSize: '12.5px' }} />
              <span>Synced & Live</span>
            </div>
          </div>
          
          {/* Right Side: Tracking Status & Employee User Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className={`status-pill ${statusClass}`} style={{ fontSize: '11px', fontWeight: 'bold' }}>
              <div className="status-dot" />
              {statusLabel}
            </div>

            {/* Smart Profile Dropdown Container */}
            {user && (
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="user-avatar"
                  style={{
                    width: '30px',
                    height: '30px',
                    fontSize: '11px',
                    margin: 0,
                    background: showProfileMenu ? 'var(--primary)' : 'var(--primary-glow)',
                    color: showProfileMenu ? '#ffffff' : 'var(--primary)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {initials}
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '38px',
                      background: '#ffffff',
                      border: '1px solid var(--sidebar-border)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-lg)',
                      width: '210px',
                      padding: '12px',
                      zIndex: 1000,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    {/* User profile card */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {user.firstName} {user.lastName}
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', marginTop: '2px' }}>
                        {user.designation || 'EMPLOYEE'}
                      </span>
                    </div>

                    <div style={{ height: '1px', background: 'var(--sidebar-border)' }} />

                    {/* Telemetry info */}
                    {sysInfo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <i className="bi bi-laptop" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: '500' }}>PC: {sysInfo.hostname}</span>
                      </div>
                    )}

                    <div style={{ height: '1px', background: 'var(--sidebar-border)' }} />

                    {/* Sign Out Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="btn-signout"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        textTransform: 'none',
                        border: 'none',
                        width: '100%',
                        background: 'var(--brand-red-glow)',
                        color: 'var(--brand-red)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: 'none',
                        margin: 0
                      }}
                    >
                      <i className="bi bi-box-arrow-right" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
