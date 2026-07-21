import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Enterprise Guard for Protected Routes.
 * Supports:
 * 1. Token authentication checks.
 * 2. Role-based access controls (RBAC).
 * 3. Permission-based access controls (PBAC).
 * 4. Preserves navigation state to redirect users back after login.
 */
export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requiredPermissions = [], 
  fallbackPath 
}) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  // 1. Authenticated check
  if (!token) {
    // Redirect to login but save the current location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role-based access check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />;
    }
    // Smart role-based fallback destinations
    const defaultDest = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role) ? '/dashboard' : '/employee';
    return <Navigate to={defaultDest} replace />;
  }

  // 3. Permission-based access check (Enterprise Extension)
  if (requiredPermissions.length > 0) {
    const userPermissions = user?.permissions || [];
    const hasAllPermissions = requiredPermissions.every(perm => userPermissions.includes(perm));
    
    if (!hasAllPermissions) {
      if (fallbackPath) {
        return <Navigate to={fallbackPath} replace />;
      }
      const defaultDest = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role) ? '/dashboard' : '/employee';
      return <Navigate to={defaultDest} replace />;
    }
  }

  // Authorized - Render child component tree
  return children;
}




