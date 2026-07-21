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
          background: 'var(--bg-card)',
          border: '1px solid var(--border-base)',
          borderRadius: '18px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.15), 0 0 0 1px var(--border-subtle)',
          overflow: 'hidden',
          color: 'var(--text-primary)',
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
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            {title && (
              <h3 className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            )}
            <button
              onClick={onClose}
              className="ml-auto p-1.5 rounded-lg transition-colors"
              style={{ background: 'transparent', color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-alt)'}
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




