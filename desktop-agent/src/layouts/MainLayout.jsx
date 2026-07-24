import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTracking } from '../contexts/TrackingContext';

export const MainLayout = () => {
  const { user } = useAuth();
  const { shiftActive, isPaused } = useTracking();

  const statusClass = shiftActive ? (isPaused ? 'paused' : 'working') : 'offline';
  const statusLabel = shiftActive ? (isPaused ? 'Paused' : 'Active') : 'Offline';

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'TT';

  return (
    <div className="app-shell">
      {/* ── Top Navbar ── */}
      <nav className="top-navbar">
        <div className="navbar-brand-block">
          <div className="brand-icon">TT</div>
          <span className="brand-name">taskTracky.Agent</span>
          <span className="brand-version">v2.0</span>
        </div>

        <div className="navbar-right">
          {/* Live Status Pill */}
          <div className={`status-pill ${statusClass}`}>
            <div className="status-dot" />
            {statusLabel}
          </div>

          {/* User Chip */}
          {user && (
            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <div>
                <div className="user-info-name">
                  {user.firstName} {user.lastName}
                </div>
                <div className="user-info-role">
                  {user.designation || 'EMPLOYEE'}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
};
