import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import AccountantDashboard from './pages/AccountantDashboard';
import HousekeepingDashboard from './pages/HousekeepingDashboard';
import MaintenanceDashboard from './pages/MaintenanceDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { normalizeRole } from './services/authService';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in on app load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Validate user data has required fields
        if (userData && userData.role) {
          const normalizedUser = { ...userData, role: normalizeRole(userData.role) };
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          setCurrentUser(normalizedUser);
        } else {
          // Invalid user data, clear it
          console.warn('Invalid user data in localStorage, clearing...');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    const onUnauthorized = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, []);

  const handleLogin = (user) => {
    setCurrentUser({ ...user, role: normalizeRole(user?.role) });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              currentUser && currentUser.role ? (
                <Navigate to={`/${currentUser.role}`} replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/receptionist"
            element={
              <ProtectedRoute isAuthenticated={currentUser?.role === 'receptionist'} allowedRoles={['receptionist']}>
                <ReceptionistDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant"
            element={
              <ProtectedRoute isAuthenticated={currentUser?.role === 'accountant'}>
                <AccountantDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/housekeeper"
            element={
              <ProtectedRoute isAuthenticated={currentUser?.role === 'housekeeper'}>
                <HousekeepingDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute isAuthenticated={currentUser?.role === 'maintenance'}>
                <MaintenanceDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute isAuthenticated={currentUser?.role === 'manager'}>
                <ManagerDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              currentUser && currentUser.role ? (
                <Navigate to={`/${currentUser.role}`} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
