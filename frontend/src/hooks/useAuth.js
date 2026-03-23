import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        // Optionally verify token with backend
        authService.getProfile().then((result) => {
          if (result.success) {
            setUser(result.user);
            localStorage.setItem('user', JSON.stringify(result.user));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
          }
        }).catch(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        });
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      setUser(result.user);
      return result;
    }
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return { user, isLoading, login, logout };
};