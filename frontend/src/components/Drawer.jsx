import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ isOpen, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg h-full flex flex-col z-10 animate-slide-in"
        style={{
          background: 'linear-gradient(180deg, #141a28 0%, #0d1117 100%)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '-24px 0 64px rgba(0,0,0,0.55)',
        }}
      >
        {/* Ambient left edge line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: '2px',
          background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.50), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h3 className="text-[14px] font-bold text-white tracking-tight">{title}</h3>
            <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(99,102,241,0.5), transparent)', marginTop: '6px', width: '60px' }} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors text-gray-500 hover:text-white"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
}
