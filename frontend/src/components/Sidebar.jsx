import React from 'react';
import { ChevronRight } from 'lucide-react';
import Select from './Select';
import { useEntitlements } from '../contexts/EntitlementContext';
import { ROLE_NAV_CONFIG } from '../config/roleNavigation';

const NavItem = ({ icon: Icon, label, active, onClick, iconColor }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-150 nav-item ${active ? 'nav-item-active' : ''}`}
    style={{ color: active ? '#a5b4fc' : 'var(--text-secondary)' }}
  >
    <Icon className="w-4 h-4 shrink-0" style={{ color: active ? '#818cf8' : iconColor || 'var(--text-muted)' }} />
    <span className="flex-1 text-left">{label}</span>
    {active && <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />}
  </button>
);

const NavSection = ({ label, children }) => (
  <div className="space-y-0.5">
    <span className="block text-[9px] font-bold uppercase tracking-widest px-3 mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {label}
    </span>
    {children}
  </div>
);

export default function Sidebar({
  user,
  activeTab,
  setActiveTab,
  companies = [],
  selectedCompanyId = '',
  setSelectedCompanyId
}) {
  const role = user?.role || 'EMPLOYEE';
  const roleConfig = ROLE_NAV_CONFIG[role] || ROLE_NAV_CONFIG.EMPLOYEE;
  const isCompanyAdmin = ['ADMIN', 'MANAGER', 'HR'].includes(role);
  const { canUse } = useEntitlements();

  return (
    <aside
      className="w-full md:w-60 flex-shrink-0 flex flex-col gap-5 p-4 h-auto md:h-screen md:sticky md:top-0"
      style={{
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Active Workspace selector */}
      {isCompanyAdmin && (
        <div className="space-y-2">
          <label className="block text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>
            Active Workspace
          </label>
          {companies.length === 0 ? (
            <div className="text-[11px] italic px-3 py-2 rounded-xl" style={{ color: 'var(--text-muted)', background: 'var(--bg-card-alt)' }}>
              No workspace assigned
            </div>
          ) : (
            <Select
              value={selectedCompanyId}
              onChange={e => setSelectedCompanyId(e.target.value)}
              className="w-full text-[12px]"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          )}
          <hr className="divider mt-3" />
        </div>
      )}

      {/* Dynamic Scalable Role Navigation */}
      <nav className="space-y-5 flex-1 overflow-y-auto pr-1">
        {roleConfig.sections.map((section, sIdx) => {
          const visibleItems = section.items.filter(item => !item.module || canUse(item.module));
          if (visibleItems.length === 0) return null;

          return (
            <NavSection key={sIdx} label={section.label}>
              {visibleItems.map(item => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id || (item.id === 'payslips' && activeTab === 'print-payslip')}
                  onClick={() => setActiveTab(item.id)}
                  iconColor={item.iconColor}
                />
              ))}
            </NavSection>
          );
        })}
      </nav>

      {/* Footer System Version Tag */}
      <div className="px-3 pb-1">
        <span className="block text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>TaskTracky v2.0 · Enterprise</span>
      </div>
    </aside>
  );
}
