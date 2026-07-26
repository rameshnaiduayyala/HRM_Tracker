import React from 'react';
import { useEntitlements } from '../contexts/EntitlementContext';

export default function FeatureGuard({ feature, children, fallback = null }) {
  const { canUseFeature } = useEntitlements();

  if (!feature || canUseFeature(feature)) {
    return children;
  }

  return fallback || (
    <div className="p-8 text-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl my-6">
      <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">Feature Locked</h3>
      <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
        This feature is not enabled for the current organization's subscription.
      </p>
    </div>
  );
}
