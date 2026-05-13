import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import styles from '../styles/Login.module.css';

/**
 * Unknown URL when the user is not signed in (see App catch-all `*`).
 */
const NotFound = () => {
  return (
    <div className={styles.page}>
      <div className={styles.ambient} aria-hidden />
      <div className={styles.shell} style={{ justifyContent: 'center', minHeight: '100vh' }}>
        <main className={styles.main} style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className={styles.card} style={{ textAlign: 'center' }}>
            <FileQuestion size={48} strokeWidth={1.5} aria-hidden style={{ marginBottom: '1rem', color: '#64748b' }} />
            <h1 className={styles.title} style={{ fontSize: '1.5rem' }}>Page not found</h1>
            <p className={styles.subtitle} style={{ marginTop: '0.75rem' }}>
              This URL does not exist in the staff console.
            </p>
            <p className={styles.hint} style={{ marginTop: '1.25rem' }}>
              If you have an account, sign in to open your dashboard.
            </p>
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/login" className={styles.submit} style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                Go to sign-in
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotFound;
