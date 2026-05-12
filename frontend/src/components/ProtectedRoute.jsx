import React from 'react';
import { Navigate } from 'react-router-dom';
import { normalizeRole } from '../services/authService';

/**
 * @param {boolean} isAuthenticated - true when session is valid (e.g. after profile hydration)
 * @param {string[]} [allowedRoles] - if non-empty, user role must be in this list
 * @param {object} [user] - current user from App state (preferred over localStorage)
 */
const ProtectedRoute = ({ children, isAuthenticated, allowedRoles = [], user: userFromParent }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  let user = userFromParent;
  if (!user?.role) {
    try {
      user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }
  }

  const normalizedRole = normalizeRole(user?.role);
  const allowed = allowedRoles.map((r) => normalizeRole(r));
  if (allowedRoles.length > 0 && !allowed.includes(normalizedRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
