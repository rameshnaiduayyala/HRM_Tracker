import React, { useState, useEffect } from 'react';
import { useTracking } from '../../contexts/TrackingContext';
import { invoke } from '@tauri-apps/api/core';

export const DashboardPage = () => {
  const { shiftActive, isPaused, stats, startShift, pauseShift, resumeShift, endShift } = useTracking();
  const [sysInfo, setSysInfo] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Synced');
  const [sessionTime, setSessionTime] = useState(0);

  // Fetch system details & monitor sync status
  useEffect(() => {
    invoke('get_system_info')
      .then((info) => setSysInfo(info))
      .catch((e) => console.error("System info error", e));

    const syncInterval = setInterval(async () => {
      try {
        const pending = await invoke('get_pending_sync_count');
        setSyncStatus(pending > 0 ? `Syncing (${pending} files)` : 'Synced');
      } catch (e) {
        console.error(e);
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, []);

  // Session timer increment
  useEffect(() => {
    let timer;
    if (shiftActive && !isPaused) {
      timer = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    } else if (!shiftActive) {
      setSessionTime(0);
    }
    return () => clearInterval(timer);
  }, [shiftActive, isPaused]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map((val) => String(val).padStart(2, '0'))
      .join(':');
  };

  return (
    <div className="container-fluid py-2">
      <div className="row g-4">
        {/* Left Side: Shift Control Center */}
        <div className="col-lg-6">
          <div className="card custom-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-black text-uppercase mb-0 font-monospace" style={{ letterSpacing: '-0.5px' }}>
                Tracking Controls
              </h4>
              {shiftActive && (
                <span className="badge bg-white border border-2 border-dark text-dark px-3 py-2 rounded-0 font-monospace fw-bold">
                  SESSION: {formatTime(sessionTime)}
                </span>
              )}
            </div>
            <hr style={{ borderTop: '2px solid var(--border-color)', opacity: 1 }} />

            <div className="d-flex align-items-center gap-4 my-4 p-3 border border-2 border-dark bg-light">
              <div className="position-relative">
                <div className={`p-4 d-flex align-items-center justify-content-center text-white border border-2 border-dark ${shiftActive ? (isPaused ? 'bg-warning text-dark' : 'bg-danger text-white glow-active') : 'bg-secondary'}`} style={{ width: '70px', height: '70px' }}>
                  <i className={`bi ${shiftActive ? (isPaused ? 'bi-pause-fill' : 'bi-play-fill') : 'bi-stop-fill'} fs-2`}></i>
                </div>
              </div>
              <div>
                <h5 className="mb-1 fw-black text-uppercase font-monospace">
                  {shiftActive ? (isPaused ? 'TRACKING PAUSED' : 'TRACKING RUNNING') : 'TRACKING OFFLINE'}
                </h5>
                <p className="text-muted small mb-0 text-uppercase font-monospace" style={{ fontSize: '10px' }}>
                  {shiftActive ? 'Physical telemetry inputs are synced to core.' : 'Tracker is suspended. No data collected.'}
                </p>
              </div>
            </div>

            <div className="d-flex gap-3 flex-wrap mt-auto">
              {!shiftActive ? (
                <button className="btn btn-danger btn-lg flex-grow-1 py-3 fw-black text-uppercase rounded-0 border border-2 border-dark" onClick={startShift} style={{ background: 'var(--primary-color)' }}>
                  Start Shift
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button className="btn btn-success btn-lg flex-grow-1 py-3 fw-black text-white text-uppercase rounded-0 border border-2 border-dark" onClick={resumeShift}>
                      Resume
                    </button>
                  ) : (
                    <button className="btn btn-warning btn-lg flex-grow-1 py-3 fw-black text-dark text-uppercase rounded-0 border border-2 border-dark" onClick={pauseShift}>
                      Pause
                    </button>
                  )}
                  <button className="btn btn-dark btn-lg flex-grow-1 py-3 fw-black text-uppercase rounded-0 border border-2 border-dark" onClick={() => endShift('Manual End')}>
                    Stop
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Activity Analytics */}
        <div className="col-lg-6">
          <div className="card custom-card p-4 h-100">
            <h4 className="fw-black text-uppercase mb-3 font-monospace" style={{ letterSpacing: '-0.5px' }}>
              Workstation Telemetry
            </h4>
            <hr style={{ borderTop: '2px solid var(--border-color)', opacity: 1 }} />
            
            <div className="row g-3 my-2">
              <div className="col-sm-6">
                <div className="border border-2 border-dark p-3 text-center bg-white">
                  <h6 className="text-uppercase small mb-2 font-monospace fw-bold">
                    Keyboards
                  </h6>
                  <h2 className="fw-black mb-0 font-monospace text-dark" style={{ fontSize: '36px' }}>{stats.keyboardCount}</h2>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="border border-2 border-dark p-3 text-center bg-white">
                  <h6 className="text-uppercase small mb-2 font-monospace fw-bold">
                    Mouse Clicks
                  </h6>
                  <h2 className="fw-black mb-0 font-monospace text-dark" style={{ fontSize: '36px' }}>{stats.mouseCount}</h2>
                </div>
              </div>
              <div className="col-12">
                <div className="border border-2 border-dark p-3 bg-white">
                  <h6 className="text-uppercase small mb-2 font-monospace fw-bold">
                    Active window
                  </h6>
                  <p className="fw-bold mb-0 text-truncate font-monospace text-dark" style={{ fontSize: '12px' }}>
                    {stats.activeWindow}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-3 d-flex justify-content-between align-items-center border-top border-2 border-dark">
              <span className="text-uppercase small font-monospace fw-bold">Sync status:</span>
              <span className={`badge px-3 py-2 rounded-0 border border-2 border-dark text-uppercase font-monospace fw-bold ${syncStatus === 'Synced' ? 'bg-white text-success' : 'bg-dark text-white'}`}>
                {syncStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Full-width System Specs Footer */}
        {sysInfo && (
          <div className="col-12">
            <div className="card custom-card p-3 border border-2 border-dark bg-white">
              <div className="row text-center text-sm-start g-2 small text-uppercase font-monospace" style={{ fontSize: '11px' }}>
                <div className="col-md-3"><strong>Workstation:</strong> <span className="text-dark fw-bold">{sysInfo.hostname}</span></div>
                <div className="col-md-3"><strong>OS Version:</strong> <span className="text-dark fw-bold">{sysInfo.os}</span></div>
                <div className="col-md-3"><strong>MAC Address:</strong> <span className="text-dark fw-bold">{sysInfo.macAddress}</span></div>
                <div className="col-md-3"><strong>Hardware:</strong> <span className="text-dark fw-bold">RAM: {sysInfo.ram}GB | CPU: {sysInfo.cpuCount} Cores</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
