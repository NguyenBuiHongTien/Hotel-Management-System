import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import styles from '../styles/Login.module.css';

/**
 * Shown when the user is signed in but their role cannot open a route.
 */
const Forbidden = () => {
  const location = useLocation();
  const from = location.state?.from;

  return (
    <div className={styles.page}>
      <div className={styles.ambient} aria-hidden />
      <div className={styles.shell} style={{ justifyContent: 'center', minHeight: '100vh' }}>
        <main className={styles.main} style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className={styles.card} style={{ textAlign: 'center' }}>
            <ShieldAlert size={48} strokeWidth={1.5} aria-hidden style={{ marginBottom: '1rem', color: '#c2410c' }} />
            <h1 className={styles.title} style={{ fontSize: '1.5rem' }}>Access denied</h1>
            <p className={styles.subtitle} style={{ marginTop: '0.75rem' }}>
              Your account does not have permission to open this page.
              {from ? (
                <>
                  {' '}
                  <span style={{ opacity: 0.85 }}>(Requested: <code>{from}</code>)</span>
                </>
              ) : null}
            </p>
            <p className={styles.hint} style={{ marginTop: '1.25rem' }}>
              Sign in with a user that has the correct role, or return to your dashboard from the link below.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/login" className={styles.submit} style={{ textAlign: 'center', textDecoration: 'none' }}>
                Back to sign-in
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Forbidden;
