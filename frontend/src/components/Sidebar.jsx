import React from 'react';
import { Sidebar as ProSidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import { LogOut, Building2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from './Select';
import { useEntitlements } from '../contexts/EntitlementContext';
import { ROLE_NAV_CONFIG } from '../config/roleNavigation';
import { useAuthStore } from '../store/useAuthStore';
import FocusTrackLogo from '../assets/focustrack-logo.png';

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
  const rawLogo = isSuperAdmin ? null : (activeCompany?.logoUrl || activeCompany?.logo || user?.companyLogo);
  const tenantLogo = rawLogo
    ? (rawLogo.startsWith('data:') || rawLogo.startsWith('http') ? rawLogo : `http://localhost:5000${rawLogo}`)
    : FocusTrackLogo;
  const companyName = activeCompany?.name || 'Workspace';

  return (
    <aside
      className="theme-adaptive-sidebar"
      style={{
        display: 'flex',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
      }}
    >
      <ProSidebar
        backgroundColor="transparent"
        width="260px"
        rootStyles={{
          color: 'var(--text-secondary)',
          borderRight: 'none',
        }}
      >
        {/* Header Branding Container */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <img
              src={tenantLogo}
              alt={companyName}
              style={{ maxHeight: '38px', maxWidth: '190px', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.src = FocusTrackLogo;
              }}
            />
          </div>

          {/* Workspace Dropdown */}
          {!isSuperAdmin && isCompanyAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={12} /> Active Workspace
              </span>
              {companies.length === 0 ? (
                <div style={{ fontSize: '11px', fontStyle: 'italic', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-card-alt)', color: 'var(--text-muted)' }}>
                  Unassigned
                </div>
              ) : (
                <Select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg border py-2 px-3 transition"
                  style={{
                    background: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-base)',
                  }}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{c.name}</option>
                  ))}
                </Select>
              )}
            </div>
          )}
        </div>

        {/* Enterprise Menu connected with Light & Dark Theme Context */}
        <Menu
          menuItemStyles={{
            button: ({ active }) => ({
              fontSize: '12px',
              fontWeight: active ? '700' : '500',
              color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
              backgroundColor: active ? 'var(--accent-primary-glow)' : 'transparent',
              borderLeft: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
              borderRadius: '8px',
              margin: '3px 10px',
              padding: '9px 12px',
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: 'var(--accent-primary-subtle)',
                color: 'var(--text-primary)',
              },
            }),
            subMenu: {
              backgroundColor: 'transparent',
            },
          }}
        >
          {roleConfig.sections.map((section, sIdx) => {
            const visibleItems = section.items.filter(item => item.alwaysShow || !item.module || canUse(item.module));
            if (visibleItems.length === 0) return null;

            // Check if any sub-item inside this section is currently active
            const hasActiveChild = visibleItems.some(item =>
              (item.path && location.pathname === item.path) ||
              activeTab === item.id ||
              (item.id === 'payslips' && activeTab === 'print-payslip')
            );

            // Default ALL CLOSED unless a child inside is currently active
            return (
              <SubMenu
                key={sIdx}
                label={section.label}
                defaultOpen={hasActiveChild}
                rootStyles={{
                  '& .ps-submenu-content': {
                    backgroundColor: 'var(--bg-card-alt) !important',
                    borderLeft: '1px solid var(--border-subtle)',
                    marginLeft: '18px',
                    borderRadius: '0 0 10px 10px',
                  },
                  '& .ps-menu-button': {
                    fontSize: '10px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '1.2px',
                    color: hasActiveChild ? 'var(--accent-primary) !important' : 'var(--text-muted) !important',
                    margin: '8px 10px 2px 10px',
                    borderRadius: '8px',
                    '&:hover': {
                      color: 'var(--accent-primary) !important',
                      backgroundColor: 'var(--accent-primary-subtle) !important',
                    }
                  }
                }}
              >
                {visibleItems.map((item) => {
                  const IconComp = item.icon;
                  const isActive =
                    (item.path && location.pathname === item.path) ||
                    activeTab === item.id ||
                    (item.id === 'payslips' && activeTab === 'print-payslip');

                  return (
                    <MenuItem
                      key={item.id}
                      active={isActive}
                      icon={<IconComp size={15} color={isActive ? 'var(--accent-primary)' : item.iconColor || 'var(--text-muted)'} />}
                      onClick={() => handleNavigate(item)}
                    >
                      {item.label}
                    </MenuItem>
                  );
                })}
              </SubMenu>
            );
          })}
        </Menu>

        {/* Premium Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              navigate('/login');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={16} /> Logout Account
          </button>
        </div>
      </ProSidebar>
    </aside>
  );
}
