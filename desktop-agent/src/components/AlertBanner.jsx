import React from 'react';

export const AlertBanner = ({ type, message }) => (
  <div className={`alert-ent ${type === 'danger' ? 'danger' : 'info'}`}>
    {message}
  </div>
);

export default AlertBanner;
