import React from 'react';
import ReactModal from 'react-modal';
import { X } from 'lucide-react';

ReactModal.setAppElement('#root');

const SIZE_MAP = {
  sm:   'max-w-md',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-full m-4',
};

export default function Modal({ isOpen, onClose, title, size = 'lg', children }) {
  const maxW = SIZE_MAP[size] || SIZE_MAP.lg;

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      closeTimeoutMS={240}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
      className={`relative w-full ${maxW} outline-none animate-fade-up`}
      contentLabel={title || 'Dialog'}
      style={{
        overlay: {
          background: 'rgba(0,0,0,0.70)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        },
      }}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, #141a28 0%, #0d1117 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.04)',
          overflow: 'hidden',
          color: '#e2e8f0',
        }}
      >
        {/* Ambient top line */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.45), transparent)',
          position: 'absolute',
          top: 0, left: 0, right: 0,
          pointerEvents: 'none',
        }} />

        {/* Header */}
        {(title || onClose) && (
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            {title && (
              <h3 className="text-[14px] font-bold tracking-tight text-white">{title}</h3>
            )}
            <button
              onClick={onClose}
              className="ml-auto p-1.5 rounded-lg transition-colors text-gray-500 hover:text-white"
              style={{ background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto max-h-[75vh] p-6">
          {children}
        </div>
      </div>
    </ReactModal>
  );
}
