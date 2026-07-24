import React from 'react';

export const StatusHeader = ({ shiftTimeText, statusText, statusBadgeClass, workstation, onLogout }) => (
  <div className="card custom-card p-2 mb-3 bg-white">
    <div className="d-flex flex-wrap justify-content-between align-items-center font-monospace" style={{ fontSize: '11px', gap: '15px' }}>
      <div className="d-flex align-items-center gap-3">
        <div><strong>SHIFT LOGGED:</strong> <span className="text-danger fw-bold">{shiftTimeText}</span></div>
        <div className="text-muted">|</div>
        <div className="d-flex align-items-center gap-2">
          <strong>STATUS:</strong>
          <span className={`badge rounded-0 border border-1 border-dark px-2 py-1 ${statusBadgeClass}`} style={{ fontSize: '9px' }}>
            {statusText}
          </span>
        </div>
      </div>
      <div className="d-flex align-items-center gap-3">
        <div><strong>WORKSTATION:</strong> <span className="text-dark fw-bold">{workstation}</span></div>
        <button className="btn btn-xs btn-dark rounded-0 border border-1 border-dark font-monospace text-uppercase" onClick={onLogout} style={{ fontSize: '9px', padding: '2px 8px' }}>
          Sign Out
        </button>
      </div>
    </div>
  </div>
);

export default StatusHeader;
