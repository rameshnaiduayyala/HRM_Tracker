import React from 'react';

export const AlertBanner = ({ type, message }) => (
  <div className={`alert alert-${type} rounded-0 border border-2 border-dark text-uppercase font-monospace fw-bold mb-3 small`} style={{ letterSpacing: '0.5px' }}>
    {message}
  </div>
);

export default AlertBanner;
