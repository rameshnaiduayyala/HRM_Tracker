import React from 'react';

const getLineClass = (log) => {
  if (log.includes('✔') || log.includes('started') || log.includes('resumed')) return 'log-line-ok';
  if (log.includes('✖') || log.includes('failed') || log.includes('error')) return 'log-line-err';
  if (log.includes('⚠') || log.includes('Inactivity') || log.includes('Paused')) return 'log-line-warn';
  if (log.includes('Ready') || log.includes('Awaiting') || log.includes('detected')) return 'log-line-info';
  return '';
};

export const LogConsole = ({ logs, label }) => (
  <div className="log-console">
    <div className="log-console-header">
      <div className="log-console-dot" style={{ background: '#ef4444' }} />
      <div className="log-console-dot" style={{ background: '#f59e0b' }} />
      <div className="log-console-dot" style={{ background: '#22c55e' }} />
      <span className="card-label" style={{ marginLeft: '8px' }}>{label || 'Telemetry Console'}</span>
    </div>
    <div className="log-console-body">
      {logs && logs.length > 0
        ? logs.map((log, idx) => {
            const ts = log.match(/^\[.*?\]/)?.[0] || '';
            const rest = log.replace(ts, '').trim();
            return (
              <div key={idx} className={getLineClass(log)}>
                <span className="log-line-ts">{ts} </span>{rest}
              </div>
            );
          })
        : <span className="log-line-info">Console idle — awaiting session start...</span>}
    </div>
  </div>
);

export default LogConsole;
