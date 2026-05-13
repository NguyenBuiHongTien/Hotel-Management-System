import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { normalizeRole } from '../services/authService';

/**
 * @param {boolean} isAuthenticated - true when session is valid (e.g. after profile hydration)
 * @param {string[]} [allowedRoles] - if non-empty, user role must be in this list
 * @param {object} [user] - current user from App state (preferred over localStorage)
 */
const ProtectedRoute = ({ children, isAuthenticated, allowedRoles = [], user: userFromParent }) => {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  let user = userFromParent;
  if (!user?.role) {
    try {
      user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }
  }

  const normalizedRole = normalizeRole(user?.role);
  const allowed = allowedRoles.map((r) => normalizeRole(r));
  if (allowedRoles.length > 0 && !allowed.includes(normalizedRole)) {
    return (
      <Navigate
        to="/forbidden"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
