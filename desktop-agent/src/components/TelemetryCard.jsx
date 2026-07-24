import React from 'react';

export const TelemetryCard = ({ label, title, subtitle, value, colorClass }) => (
  <div className={`metric-card ${colorClass || 'blue'}`}>
    <div className="metric-label">{label}</div>
    {value !== undefined ? (
      <div className="metric-value">{value}</div>
    ) : (
      <div className="metric-value" style={{ fontSize: '14px', letterSpacing: '-0.2px' }}>
        {title || '—'}
      </div>
    )}
    {subtitle && <div className="metric-sub">{subtitle}</div>}
  </div>
);

export default TelemetryCard;
