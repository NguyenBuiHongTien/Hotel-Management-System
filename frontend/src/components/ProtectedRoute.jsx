import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAuthenticated, allowedRoles = [] }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Lấy user từ localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Kiểm tra role nếu có allowedRoles
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;