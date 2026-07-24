import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const Accordion = ({ 
  title, 
  icon, 
  defaultOpen = true, 
  badge,
  children 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="w-full bg-[var(--bg-card)] border border-[var(--border-base)] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:border-indigo-500/30 hover:shadow-indigo-500/2">
      {/* Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[var(--bg-card-alt)]/30 transition-all duration-200 focus:outline-none select-none"
      >
        <div className="flex items-center gap-4">
          {icon && (
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 transition-colors">
              {icon}
            </div>
          )}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              {title}
            </h4>
          </div>
          {badge !== undefined && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              {badge}
            </span>
          )}
        </div>
        
        <div className="p-1.5 bg-[var(--bg-card-alt)] hover:bg-[var(--bg-card-alt)]/80 rounded-lg transition-colors border border-[var(--border-base)]">
          <ChevronDown 
            className={`w-3.5 h-3.5 text-[var(--text-secondary)] transform transition-transform duration-350 ${
              isOpen ? 'rotate-180 text-indigo-400' : 'rotate-0'
            }`} 
          />
        </div>
      </button>

      {/* Content Panel (Transitions height smoothly) */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen 
            ? 'max-h-[3000px] opacity-100 border-t border-[var(--border-base)]/40' 
            : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;
