import React from 'react';

export const TrackingControls = ({
  clockedIn,
  onClockToggle,
  shiftActive,
  onSessionToggle
}) => (
  <div className="controls-panel">
    <div className="ctrl-btn" style={{ flex: 1 }}>
      <span className="btn-label">Attendance</span>
      <button
        className={`btn-ent ${clockedIn ? 'btn-clockout' : 'btn-clockin'}`}
        onClick={onClockToggle}
      >
        {clockedIn ? '⬡  Clock Out' : '⬢  Clock In'}
      </button>
    </div>

    <div style={{ width: '1px', height: '40px', background: 'var(--card-border)', flexShrink: 0 }} />

    <div className="ctrl-btn" style={{ flex: 1 }}>
      <span className="btn-label">Work Tracker</span>
      <button
        className={`btn-ent ${shiftActive ? 'btn-stop' : 'btn-start'}`}
        onClick={onSessionToggle}
        disabled={!clockedIn}
      >
        {shiftActive ? '⏹  Break / Stop' : '▶  Start Tracker'}
      </button>
    </div>
  </div>
);

export default TrackingControls;
