import React from 'react';

export const LogConsole = ({ logs, label }) => (
  <div className="card custom-card p-3 bg-white">
    <span className="text-uppercase font-monospace text-muted mb-2 d-block" style={{ fontSize: '10px', fontWeight: 'bold' }}>
      {label || 'TELEMETRY LOG CONSOLE'}
    </span>
    <div
      className="border border-2 border-dark p-3 font-monospace"
      style={{
        backgroundColor: '#030712',
        color: '#10B981',
        fontSize: '11px',
        height: '140px',
        overflowY: 'auto',
        textAlign: 'left',
        whiteSpace: 'pre-wrap'
      }}
    >
      {logs && logs.length > 0
        ? logs.map((log, idx) => <div key={idx}>{log}</div>)
        : 'Console idle. Collecting telemetry inputs...'}
    </div>
  </div>
);

export default LogConsole;
