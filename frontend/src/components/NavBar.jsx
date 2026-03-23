import React from 'react';
import { LogOut } from 'lucide-react';
import styles from '../styles/NavBar.module.css';

const NavBar = ({ title, icon: Icon, onLogout }) => {
  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <div className={styles.navLeft}>
          {Icon && <Icon className={styles.navIcon} />}
          <h1 className={styles.navTitle}>{title}</h1>
        </div>

        <button onClick={onLogout} className={styles.logoutBtn}>
          <LogOut />
          <span>Đăng xuất</span>
        </button>
      </div>
    </nav>
  );
};

export default NavBar;