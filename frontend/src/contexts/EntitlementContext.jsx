import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { companyApi } from '../services/company.service';
import {
  ENTITLEMENT_FEATURES,
  FEATURE_ENTITLEMENT_MAP,
  MODULE_ENTITLEMENT_MAP,
  MODULE_KEYS,
} from '../config/entitlements';

const EntitlementContext = createContext(null);

export function EntitlementProvider({ children }) {
  const { user, token } = useAuthStore();
  const [features, setFeatures] = useState([]);
  const [employeeLimit, setEmployeeLimit] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      setFeatures([]);
      setEmployeeLimit(0);
      return;
    }

    // Super admin bypasses all loading/limits
    if (user.role === 'SUPER_ADMIN') {
      setFeatures(['All Features']);
      setEmployeeLimit(99999);
      return;
    }

    async function loadEntitlements() {
      setLoading(true);
      try {
        // Fetch active companies under tenant
        const res = await companyApi.list();
        const companies = res.data?.companies || [];
        if (companies.length > 0) {
          const activeCompany = companies[0]; // Active division
          const activeSub = activeCompany.subscriptions?.find(sub => sub.status === 'ACTIVE');
          if (activeSub && activeSub.plan) {
            setFeatures(activeSub.plan.features || []);
            setEmployeeLimit(activeSub.plan.employeeLimit || 5);
          }
        }
      } catch (err) {
        console.error('Failed to load company entitlements:', err);
      } finally {
        setLoading(false);
      }
    }

    loadEntitlements();
  }, [token, user]);

  const hasAnyRequiredFeature = (requiredFeatures = []) => {
    if (user?.role === 'SUPER_ADMIN') return true;
    if (features.includes(ENTITLEMENT_FEATURES.ALL)) return true;
    if (requiredFeatures.length === 0) return true;

    return requiredFeatures.some((requiredFeature) => features.includes(requiredFeature));
  };

  const canUseModule = (moduleKey) => {
    if (!moduleKey) return true;
    if (user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER') return true;
    if (moduleKey === MODULE_KEYS.HRM) return true;

    const requiredFeatures = MODULE_ENTITLEMENT_MAP[moduleKey] || [moduleKey];
    return hasAnyRequiredFeature(requiredFeatures);
  };

  const canUseFeature = (featureKey) => {
    if (!featureKey) return true;

    const requiredFeatures = FEATURE_ENTITLEMENT_MAP[featureKey] || [featureKey];
    return hasAnyRequiredFeature(requiredFeatures);
  };

  const canUse = (key) => {
    if (MODULE_ENTITLEMENT_MAP[key]) {
      return canUseModule(key);
    }

    return canUseFeature(key);
  };

  const getLimit = (limitType) => {
    if (limitType === 'employees') {
      return employeeLimit;
    }
    return 0;
  };

  return (
    <EntitlementContext.Provider value={{ canUse, canUseModule, canUseFeature, getLimit, loading, features }}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlements() {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error('useEntitlements must be used within an EntitlementProvider');
  }
  return context;
}

/**
 * Route protection guard based on Feature Entitlement.
 */
export function EntitlementGuard({ feature, children }) {
  const { canUse, loading } = useEntitlements();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!canUse(feature)) {
    return <React.Fragment>{React.createElement('span', null, `Not Entitled to feature ${feature}`)}</React.Fragment>;
  }

  return children;
}
