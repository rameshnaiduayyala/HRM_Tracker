import React from 'react';

export const TrackingControls = ({
  clockedIn,
  onClockToggle,
  shiftActive,
  onSessionToggle
}) => (
  <div className="card custom-card p-3 mb-3 bg-white">
    <div className="row g-3">
      <div className="col-md-6 text-center">
        <span className="text-muted text-uppercase font-monospace small mb-2 d-block" style={{ fontSize: '10px' }}>Attendance Shift</span>
        <button
          className={`btn w-100 py-2 rounded-0 border border-2 border-dark text-uppercase fw-black font-monospace ${clockedIn ? 'btn-danger' : 'btn-success'}`}
          onClick={onClockToggle}
        >
          {clockedIn ? 'Clock Out' : 'Clock In'}
        </button>
      </div>

      <div className="col-md-6 text-center">
        <span className="text-muted text-uppercase font-monospace small mb-2 d-block" style={{ fontSize: '10px' }}>Work Tracker</span>
        <button
          className={`btn w-100 py-2 rounded-0 border border-2 border-dark text-uppercase fw-black font-monospace ${shiftActive ? 'btn-dark' : 'btn-light'}`}
          onClick={onSessionToggle}
          disabled={!clockedIn}
        >
          {shiftActive ? 'Break/Stop' : 'Start Tracker'}
        </button>
      </div>
    </div>
  </div>
);

export default TrackingControls;
