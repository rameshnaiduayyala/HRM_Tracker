import React from 'react';

export const ReasonModal = ({ title, subtitle, options, selectedOption, onSelectOption, customReason, onChangeCustomReason, isSubmitting, onSubmit, onCancel, showCancel }) => (
  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
    <div className="bg-white p-4 border border-2 border-dark rounded-0" style={{ width: '400px' }}>
      <h5 className="fw-black text-uppercase font-monospace mb-3 text-dark">{title}</h5>
      <p className="small text-uppercase font-monospace text-muted mb-3">{subtitle}</p>
      <div className="d-flex flex-wrap gap-2 mb-3">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`btn btn-sm rounded-0 border border-2 border-dark font-monospace text-uppercase fw-bold ${selectedOption === opt ? 'btn-dark' : 'btn-light'}`}
            onClick={() => onSelectOption(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
      <input
        type="text"
        className="form-control rounded-0 border border-2 border-dark font-monospace mb-3"
        placeholder="ADDITIONAL DETAILS (OPTIONAL)"
        value={customReason}
        onChange={(e) => onChangeCustomReason(e.target.value)}
      />
      <div className="d-flex gap-2 mt-3">
        {showCancel && (
          <button
            type="button"
            className="btn btn-light w-50 rounded-0 border border-2 border-dark text-uppercase fw-bold font-monospace"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className={`btn btn-danger rounded-0 border border-2 border-dark text-uppercase fw-black font-monospace ${showCancel ? 'w-50' : 'w-100'}`}
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Confirm'}
        </button>
      </div>
    </div>
  </div>
);

export default ReasonModal;
