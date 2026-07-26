import React from 'react';
import { useEntitlements } from '../contexts/EntitlementContext';

/**
 * ModuleGuard
 * Wraps routes/components to enforce SaaS module entitlements.
 */
export default function ModuleGuard({ module, children, fallback = null }) {
  const { canUseModule } = useEntitlements();

  if (!module || canUseModule(module)) {
    return children;
  }

  return fallback || (
    <div className="p-12 text-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-xl my-6">
      <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">Module Lock</h3>
      <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
        The feature module <strong className="text-white font-mono">"{module}"</strong> is not included in your organization's active subscription plan. Please contact your company administrator to upgrade.
      </p>
    </div>
  );
}
