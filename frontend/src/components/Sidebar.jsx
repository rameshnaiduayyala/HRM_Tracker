import React from 'react';
import { ChevronRight, Building2, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from './Select';
import { useEntitlements } from '../contexts/EntitlementContext';
import { ROLE_NAV_CONFIG } from '../config/roleNavigation';
import { useAuthStore } from '../store/useAuthStore';
import FocusTrackLogo from '../assets/focustrack-logo.png';

const NavItem = ({ icon: Icon, label, active, onClick, iconColor }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium tracking-tight transition-all duration-150 ${active
      ? 'font-bold'
      : 'hover:opacity-100'
      }`}
    style={{
      background: active ? 'var(--bg-elevated, rgba(99,102,241,0.12))' : 'transparent',
      color: active ? 'var(--text-primary, #ffffff)' : 'var(--text-secondary, #94a3b8)',
      borderLeft: active ? '2px solid var(--accent-primary, #6366f1)' : '2px solid transparent',
    }}
  >
    <Icon
      className="w-4 h-4 shrink-0 transition-colors"
      style={{ color: active ? 'var(--accent-primary, #818cf8)' : iconColor || 'var(--text-muted, #64748b)' }}
    />
    <span className="flex-1 text-left truncate">{label}</span>
    {active && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />}
  </button>
);

const NavSection = ({ label, children }) => (
  <div className="space-y-1">
    <div className="px-3 mb-1.5 flex items-center justify-between">
      <span
        className="text-[9px] font-black uppercase tracking-widest"
        style={{ color: 'var(--text-muted, #64748b)' }}
      >
        {label}
      </span>
    </div>
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
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isCompanyAdmin = ['ADMIN', 'MANAGER', 'HR'].includes(role);
  const { canUse } = useEntitlements();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (item) => {
    if (item.path) {
      navigate(item.path);
      return;
    }
    if (setActiveTab) {
      setActiveTab(item.id);
    }
  };

  const activeCompany = companies.find((c) => c.id === selectedCompanyId) ||
    (user?.company ? user.company : (user?.companyId ? { logoUrl: user?.companyLogo || user?.company?.logoUrl } : null));
  const rawLogo = activeCompany?.logoUrl || activeCompany?.logo || user?.companyLogo;
  const tenantLogo = rawLogo
    ? (rawLogo.startsWith('data:') || rawLogo.startsWith('http') ? rawLogo : `http://localhost:5000${rawLogo}`)
    : FocusTrackLogo;
  const companyName = activeCompany?.name || 'Workspace';

  return (
    <aside
      className="w-full md:w-60 flex-shrink-0 flex flex-col justify-between p-4 h-auto md:h-screen md:sticky md:top-0 select-none transition-colors duration-200 border-r"
      style={{
        background: 'var(--bg-surface, #0f172a)',
        borderColor: 'var(--border-subtle, rgba(255,255,255,0.08))',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div className="space-y-6 flex-1 overflow-y-auto">
        {/* Tenant Workspace Brand Header */}
        <div className="flex items-center justify-start px-3 py-3 border-b" style={{ borderColor: 'var(--border-subtle, rgba(255,255,255,0.06))' }}>
          <img
            src={tenantLogo}
            alt={companyName}
            className="h-9 w-auto max-w-[175px] object-contain shrink-0"
            onError={(e) => {
              e.currentTarget.src = FocusTrackLogo;
            }}
          />
        </div>

        {/* Workspace Selector */}
        {(isCompanyAdmin || isSuperAdmin) && (
          <div className="space-y-1.5 px-1">
            <label className="block text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted, #64748b)' }}>
              Workspace
            </label>
            {companies.length === 0 ? (
              <div className="text-[11px] italic px-3 py-1.5 rounded" style={{ color: 'var(--text-muted)', background: 'var(--bg-card-alt)' }}>
                Unassigned
              </div>
            ) : (
              <Select
                value={selectedCompanyId}
                onChange={e => setSelectedCompanyId(e.target.value)}
                className="w-full text-xs font-medium rounded border py-1.5"
                style={{
                  background: 'var(--bg-canvas, #020617)',
                  color: 'var(--text-primary, #f8fafc)',
                  borderColor: 'var(--border-base, #1e293b)',
                }}
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            )}
          </div>
        )}

        {/* Role Navigation */}
        <nav className="space-y-5 pr-1">
          {roleConfig.sections.map((section, sIdx) => {
            const visibleItems = section.items.filter(item => item.alwaysShow || !item.module || canUse(item.module));
            if (visibleItems.length === 0) return null;

            return (
              <NavSection key={sIdx} label={section.label}>
                {visibleItems.map(item => {
                  const isActive = (item.path && location.pathname === item.path) ||
                    activeTab === item.id ||
                    (item.id === 'payslips' && activeTab === 'print-payslip');

                  return (
                    <NavItem
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      active={isActive}
                      onClick={() => handleNavigate(item)}
                      iconColor={item.iconColor}
                    />
                  );
                })}
              </NavSection>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Logout Button */}
      <div className="pt-3 mt-4 border-t" style={{ borderColor: 'var(--border-subtle, rgba(255,255,255,0.06))' }}>
        <button
          onClick={() => {
            useAuthStore.getState().logout();
            navigate('/login');
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
