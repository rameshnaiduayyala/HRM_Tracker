import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTracking } from '../contexts/TrackingContext';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const { shiftActive, isPaused } = useTracking();

  return (
    <div className="d-flex flex-column vh-100" style={{ backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)' }}>
      {/* Swiss Minimalist Navbar */}
      <nav className="navbar navbar-expand-lg px-4 py-3 bg-white border-bottom border-2 border-dark rounded-0">
        <div className="container-fluid p-0">
          <span className="navbar-brand d-flex align-items-center gap-2 fw-black text-uppercase" style={{ color: 'var(--text-dark)', letterSpacing: '-1px' }}>
            <span className="fs-4 fw-extrabold px-2 py-1 text-white bg-danger" style={{ backgroundColor: 'var(--primary-color)' }}>TT</span>
            <span className="fs-5 fw-bold font-monospace">taskTracky.agent</span>
          </span>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className={`badge px-3 py-2 rounded-0 border border-2 border-dark text-uppercase fw-black ${shiftActive ? (isPaused ? 'bg-warning text-dark' : 'bg-danger text-white glow-active') : 'bg-secondary text-white'}`} style={{ fontSize: '10px', letterSpacing: '1px' }}>
                {shiftActive ? (isPaused ? 'Paused' : 'Active') : 'Offline'}
              </span>
            </div>
            {user && (
              <div className="d-flex flex-column align-items-end me-2">
                <span className="fw-bold text-uppercase small font-monospace" style={{ fontSize: '12px' }}>
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-muted small text-uppercase" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>
                  {user.designation || 'EMPLOYEE'}
                </span>
              </div>
            )}
            <button className="btn btn-dark btn-sm px-3 rounded-0 fw-black text-uppercase border-2 border-dark" onClick={logout} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              Exit
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-grow-1 overflow-auto p-4">
        <div className="container-fluid p-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};


