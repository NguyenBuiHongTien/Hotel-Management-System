import { useState, useEffect, useCallback } from 'react';
import { authService, normalizeRole } from '../services/authService';

/**
 * Single source of truth for staff session: hydrate from token, login, logout, 401 listener.
 */
export function useAuth() {
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

  const handleLogin = useCallback((user) => {
    setCurrentUser({ ...user, role: normalizeRole(user?.role) });
    setAuthChecked(true);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setCurrentUser(null);
    }
  }, []);

  return {
    currentUser,
    authChecked,
    handleLogin,
    handleLogout,
  };
}
