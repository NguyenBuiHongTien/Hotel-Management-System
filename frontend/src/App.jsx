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
import { authService, normalizeRole } from './services/authService';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('user');
        if (!cancelled) {
          setCurrentUser(null);
          setAuthChecked(true);
        }
        return;
      }

      const result = await authService.getProfile();
      if (cancelled) return;

      if (result.success && result.user?.role) {
        const u = { ...result.user, role: normalizeRole(result.user.role) };
        localStorage.setItem('user', JSON.stringify(u));
        setCurrentUser(u);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
      }
      setAuthChecked(true);
    };

    hydrateSession();

    const onUnauthorized = () => {
      setCurrentUser(null);
      setAuthChecked(true);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);

    return () => {
      cancelled = true;
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, []);

  const handleLogin = (user) => {
    setCurrentUser({ ...user, role: normalizeRole(user?.role) });
    setAuthChecked(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  if (!authChecked) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
        Signing you in…
      </div>
    );
  }

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
              <ProtectedRoute
                isAuthenticated={!!currentUser}
                allowedRoles={['receptionist']}
                user={currentUser}
              >
                <ReceptionistDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant"
            element={
              <ProtectedRoute
                isAuthenticated={!!currentUser}
                allowedRoles={['accountant']}
                user={currentUser}
              >
                <AccountantDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/housekeeper"
            element={
              <ProtectedRoute
                isAuthenticated={!!currentUser}
                allowedRoles={['housekeeper']}
                user={currentUser}
              >
                <HousekeepingDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute
                isAuthenticated={!!currentUser}
                allowedRoles={['maintenance']}
                user={currentUser}
              >
                <MaintenanceDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute
                isAuthenticated={!!currentUser}
                allowedRoles={['manager']}
                user={currentUser}
              >
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
