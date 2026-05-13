import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import NotFound from './pages/NotFound';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import AccountantDashboard from './pages/AccountantDashboard';
import HousekeepingDashboard from './pages/HousekeepingDashboard';
import MaintenanceDashboard from './pages/MaintenanceDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';

function App() {
  const { currentUser, authChecked, handleLogin, handleLogout } = useAuth();

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
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="/not-found" element={<NotFound />} />
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
          <Route
            path="*"
            element={
              currentUser && currentUser.role ? (
                <Navigate to={`/${currentUser.role}`} replace />
              ) : (
                <NotFound />
              )
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
