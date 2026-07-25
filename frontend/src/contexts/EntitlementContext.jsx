import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { companyApi } from '../services/company.service';

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

  const canUse = (featureKey) => {
    if (user?.role === 'SUPER_ADMIN') return true;
    if (features.includes('All Features')) return true;
    if (featureKey === 'hrm') return true; // Core HR always active for any subscriber

    // Map module key to seeded database plan feature strings
    let requiredSeededFeatures = [];
    switch (featureKey) {
      case 'attendance':
      case 'leave':
        requiredSeededFeatures = ['Attendance Tracking'];
        break;
      case 'tracking':
        requiredSeededFeatures = ['Basic Activity Monitoring', 'Detailed Activity Monitoring'];
        break;
      case 'screenshots':
        requiredSeededFeatures = ['Screenshots'];
        break;
      case 'tasks':
      case 'projects':
      case 'timesheets':
        requiredSeededFeatures = ['Task Management'];
        break;
      case 'reports':
        requiredSeededFeatures = ['Detailed Activity Monitoring'];
        break;
      default:
        requiredSeededFeatures = [featureKey];
    }

    return requiredSeededFeatures.some(sf => features.includes(sf));
  };

  const getLimit = (limitType) => {
    if (limitType === 'employees') {
      return employeeLimit;
    }
    return 0;
  };

  return (
    <EntitlementContext.Provider value={{ canUse, getLimit, loading, features }}>
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
export function EntitlementGuard({ feature, children, fallbackPath }) {
  const { canUse, loading } = useEntitlements();
  const { user } = useAuthStore();

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
    const dest = fallbackPath || (['ADMIN', 'SUPER_ADMIN'].includes(user?.role) ? '/dashboard' : '/employee');
    return <React.Fragment>{React.createElement('span', null, `Not Entitled to feature ${feature}`)}</React.Fragment>;
  }

  return children;
}
