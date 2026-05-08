import React from 'react';
import { Navigate } from 'react-router-dom';
import { normalizeRole } from '../services/authService';

const ProtectedRoute = ({ children, isAuthenticated, allowedRoles = [] }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
  
  // Kiểm tra role nếu có allowedRoles
  const normalizedRole = normalizeRole(user.role);
  const allowed = allowedRoles.map((r) => normalizeRole(r));
  if (allowedRoles.length > 0 && !allowed.includes(normalizedRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;