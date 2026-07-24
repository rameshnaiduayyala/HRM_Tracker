import React from 'react';

export const ReasonModal = ({
  title, subtitle, options, selectedOption, onSelectOption,
  customReason, onChangeCustomReason, isSubmitting, onSubmit, onCancel, showCancel
}) => (
  <div className="modal-overlay">
    <div className="modal-box">
      <div className="modal-title">{title}</div>
      <div className="modal-sub">{subtitle}</div>
      <div className="modal-options">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`modal-opt ${selectedOption === opt ? 'active' : ''}`}
            onClick={() => onSelectOption(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
      {selectedOption === 'Other' && (
        <input
          type="text"
          className="modal-input"
          placeholder="Type your custom reason..."
          value={customReason}
          onChange={(e) => onChangeCustomReason(e.target.value)}
        />
      )}
      <div className="modal-actions">
        {showCancel && (
          <button type="button" className="btn-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="button"
          className="btn-modal-confirm"
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
