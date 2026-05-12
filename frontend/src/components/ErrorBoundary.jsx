import React from 'react';
import styles from '../styles/Dashboard.module.css';
import buttonStyles from '../styles/Button.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundaryCard}>
          <h2 className={styles.modalFormTitle}>Something went wrong</h2>
          <p className={styles.panelMuted}>Please reload the page or contact an administrator.</p>
          <button
            type="button"
            className={`${buttonStyles.primary} ${buttonStyles.md}`}
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
