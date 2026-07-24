import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTracking } from '../contexts/TrackingContext';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const { shiftActive, isPaused } = useTracking();

  return (
    <div className="d-flex flex-column vh-100 bg-light text-dark">
      {/* Premium Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 py-2 border-bottom border-secondary">
        <div className="container-fluid">
          <span className="navbar-brand d-flex align-items-center gap-2 fw-bold text-primary">
            <i className="bi bi-cpu-fill fs-4"></i>
            <span>TaskTracky Agent</span>
          </span>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className={`badge ${shiftActive ? (isPaused ? 'bg-warning text-dark' : 'bg-success') : 'bg-secondary'}`}>
                {shiftActive ? (isPaused ? 'PAUSED' : 'ACTIVE') : 'OFFLINE'}
              </span>
            </div>
            {user && (
              <span className="text-secondary small">
                {user.firstName} {user.lastName}
              </span>
            )}
            <button className="btn btn-outline-danger btn-sm" onClick={logout}>
              <i className="bi bi-box-arrow-right"></i> Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-grow-1 overflow-auto p-4">
        <Outlet />
      </div>
    </div>
  );
};
