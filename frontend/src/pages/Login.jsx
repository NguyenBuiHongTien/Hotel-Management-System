import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { authService } from '../services/authService';
import styles from '../styles/Login.module.css';

const HTMonogram = ({ size = 'md' }) => (
  <div className={size === 'lg' ? styles.logoLg : styles.logoSm} aria-hidden>
    <span className={styles.logoHt}>HT</span>
  </div>
);

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        onLogin(result.user);
        navigate(`/${result.user.role}`);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while signing in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.ambient} aria-hidden />

      <div className={styles.shell}>
        <aside className={styles.aside}>
          <div className={styles.asideInner}>
            <HTMonogram size="lg" />
            <p className={styles.asideEyebrow}>Operations in sync</p>
            <h2 className={styles.asideHeadline}>Centralized operations</h2>
            <p className={styles.asideLead}>
              Bookings, guests, invoices, and reports — one platform for the whole property.
            </p>
            <div className={styles.asideRule} aria-hidden />
            <ul className={styles.asideFeatures}>
              <li>
                <ShieldCheck size={17} strokeWidth={1.5} aria-hidden />
                <span>JWT & role-based access</span>
              </li>
              <li>
                <LayoutDashboard size={17} strokeWidth={1.5} aria-hidden />
                <span>Role-specific dashboards</span>
              </li>
              <li>
                <Users size={17} strokeWidth={1.5} aria-hidden />
                <span>Bookings, guests &amp; finance</span>
              </li>
            </ul>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.card}>
            <header className={styles.cardHeader}>
              <div className={styles.brandRow}>
                <HTMonogram size="md" />
                <div className={styles.brandText}>
                  <p className={styles.kicker}>Staff sign-in</p>
                  <h1 className={styles.title}>HotelMaster</h1>
                </div>
              </div>
              <p className={styles.subtitle}>
                Enter your credentials to access the internal console.
              </p>
            </header>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              {error && (
                <div className={styles.error} role="alert">
                  {error}
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="login-email" className={styles.label}>
                  Email
                </label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} aria-hidden />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    placeholder="ten@hotel.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="login-password" className={styles.label}>
                  Password
                </label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} aria-hidden />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.eyeButton}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" className={styles.submit} disabled={isLoading}>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className={styles.hint}>Authorized staff only. After seeding users, default password is <code>HotelDemo1</code>.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
