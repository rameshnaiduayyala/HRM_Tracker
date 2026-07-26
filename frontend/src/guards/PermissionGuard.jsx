import React from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function PermissionGuard({
  permissions = [],
  mode = 'all',
  children,
  fallback = null,
}) {
  const { user } = useAuthStore();
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  if (requiredPermissions.length === 0 || user?.role === 'SUPER_ADMIN') {
    return children;
  }

  const userPermissions = user?.permissions || [];
  const isAllowed = mode === 'any'
    ? requiredPermissions.some((permission) => userPermissions.includes(permission))
    : requiredPermissions.every((permission) => userPermissions.includes(permission));

  return isAllowed ? children : fallback;
}
