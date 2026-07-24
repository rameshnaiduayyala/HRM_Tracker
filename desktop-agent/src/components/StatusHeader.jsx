import React from 'react';

export const StatusHeader = ({ shiftTimeText, statusText, statusClass, workstation, onLogout }) => (
  <div className="status-bar">
    <div className="status-bar-item">
      <span className="label">Shift Logged</span>
      <span className="value" style={{ color: '#e53935' }}>{shiftTimeText}</span>
    </div>
    <div className="status-bar-divider" />
    <div className="status-bar-item">
      <span className="label">Session Status</span>
      <span className={`value status-pill ${statusClass}`} style={{ display: 'inline-flex', marginTop: '2px' }}>
        <span className="status-dot" />
        {statusText}
      </span>
    </div>
    <div className="status-bar-divider" />
    <div className="status-bar-item">
      <span className="label">Workstation</span>
      <span className="value">{workstation}</span>
    </div>
    <div style={{ marginLeft: 'auto' }}>
      <button className="btn-signout" onClick={onLogout}>Sign Out</button>
    </div>
  </div>
);

export default StatusHeader;
