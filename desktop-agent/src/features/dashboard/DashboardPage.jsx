import React, { useState, useEffect } from 'react';
import { useTracking } from '../../contexts/TrackingContext';
import { invoke } from '@tauri-apps/api/core';

export const DashboardPage = () => {
  const { shiftActive, isPaused, stats, startShift, pauseShift, resumeShift, endShift } = useTracking();
  const [sysInfo, setSysInfo] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Synced');

  useEffect(() => {
    // Fetch device system information
    invoke('get_system_info')
      .then((info) => setSysInfo(info))
      .catch((e) => console.error("System info error", e));

    // Listen for upload sync updates
    let syncInterval = setInterval(async () => {
      try {
        const pending = await invoke('get_pending_sync_count');
        setSyncStatus(pending > 0 ? `Syncing (${pending} remaining)` : 'Synced');
      } catch (e) {
        console.error(e);
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, []);

  return (
    <div className="container-fluid">
      <div className="row g-4">
        {/* Left Side: Shift Control Room */}
        <div className="col-lg-6">
          <div className="card custom-card p-4 h-100 bg-white shadow-sm">
            <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-clock-history text-primary"></i> Shift Status & Controls
            </h4>
            <hr />
            <div className="d-flex align-items-center gap-4 my-4">
              <div className="position-relative">
                <div className={`p-4 rounded-circle d-flex align-items-center justify-content-center text-white ${shiftActive ? (isPaused ? 'bg-warning' : 'bg-success') : 'bg-secondary'}`} style={{ width: '90px', height: '90px' }}>
                  <i className={`bi ${shiftActive ? (isPaused ? 'bi-pause-fill' : 'bi-play-fill') : 'bi-stop-fill'} fs-1`}></i>
                </div>
              </div>
              <div>
                <h5 className="mb-1 fw-bold">
                  {shiftActive ? (isPaused ? 'Shift Paused' : 'Shift Active & Tracking') : 'Shift Offline'}
                </h5>
                <p className="text-muted small mb-0">
                  {shiftActive ? 'Tracking activity metrics and periodic desktop snapshots.' : 'Press Start to begin tracking your work day.'}
                </p>
              </div>
            </div>

            <div className="d-flex gap-3 flex-wrap">
              {!shiftActive ? (
                <button className="btn btn-primary btn-lg flex-grow-1 py-3 fw-bold" onClick={startShift}>
                  <i className="bi bi-play-circle-fill me-2"></i> Start Shift
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button className="btn btn-success btn-lg flex-grow-1 py-3 fw-bold" onClick={resumeShift}>
                      <i className="bi bi-play-circle me-2"></i> Resume Shift
                    </button>
                  ) : (
                    <button className="btn btn-warning btn-lg flex-grow-1 py-3 fw-bold text-dark" onClick={pauseShift}>
                      <i className="bi bi-pause-circle me-2"></i> Pause Shift
                    </button>
                  )}
                  <button className="btn btn-danger btn-lg flex-grow-1 py-3 fw-bold" onClick={() => endShift('Manual End')}>
                    <i className="bi bi-stop-circle me-2"></i> End Shift
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Activity Analytics & System Specs */}
        <div className="col-lg-6">
          <div className="card custom-card p-4 h-100 bg-white shadow-sm">
            <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-graph-up-arrow text-primary"></i> Real-time Activities
            </h4>
            <hr />
            <div className="row g-3 my-2">
              <div className="col-sm-6">
                <div className="border rounded p-3 text-center bg-light">
                  <h6 className="text-muted small mb-1">Keyboard Keystrokes</h6>
                  <h2 className="fw-bold mb-0 text-dark">{stats.keyboardCount}</h2>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="border rounded p-3 text-center bg-light">
                  <h6 className="text-muted small mb-1">Mouse Clicks</h6>
                  <h2 className="fw-bold mb-0 text-dark">{stats.mouseCount}</h2>
                </div>
              </div>
              <div className="col-12">
                <div className="border rounded p-3 bg-light">
                  <h6 className="text-muted small mb-1">Active Window</h6>
                  <p className="fw-bold mb-0 text-truncate text-dark">{stats.activeWindow}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 d-flex justify-content-between align-items-center">
              <span className="text-muted small">Local DB Sync Status:</span>
              <span className={`badge ${syncStatus === 'Synced' ? 'bg-success' : 'bg-primary'}`}>
                {syncStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Full-width System Specs Footer */}
        {sysInfo && (
          <div className="col-12">
            <div className="card custom-card p-3 bg-dark text-light border-secondary">
              <div className="row text-center text-sm-start g-2">
                <div className="col-md-3"><strong>Hostname:</strong> {sysInfo.hostname}</div>
                <div className="col-md-3"><strong>OS Version:</strong> {sysInfo.os}</div>
                <div className="col-md-3"><strong>MAC Address:</strong> {sysInfo.macAddress}</div>
                <div className="col-md-3"><strong>Hardware Details:</strong> RAM: {sysInfo.ram} GB | CPU: {sysInfo.cpuCount} Cores</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default DashboardPage;
