import React from 'react';

export const TelemetryCard = ({ label, title, subtitle, value, valueClass }) => (
  <div className="card custom-card p-3 bg-white h-100">
    <span className="text-uppercase font-monospace text-muted" style={{ fontSize: '9px', fontWeight: 'bold' }}>{label}</span>
    {title && (
      <h6 className="fw-black text-uppercase text-truncate mt-2 mb-1 font-monospace" style={{ fontSize: '12px' }}>
        {title}
      </h6>
    )}
    {subtitle && (
      <span className="text-muted font-monospace text-truncate d-block" style={{ fontSize: '9px' }}>
        {subtitle}
      </span>
    )}
    {value && (
      <h3 className={`fw-black font-monospace mt-2 mb-0 ${valueClass || 'text-dark'}`} style={{ fontSize: '20px' }}>
        {value}
      </h3>
    )}
  </div>
);

export default TelemetryCard;
