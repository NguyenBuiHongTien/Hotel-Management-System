import React from 'react';
import styles from '../styles/StatCard.module.css';

const StatCard = ({ title, value, icon: Icon }) => (
  <div className={styles.card}>
    <div className={styles.info}>
      <p className={styles.title}>{title}</p>
      <p className={styles.value}>{value}</p>
    </div>
    {Icon ? <Icon className={styles.icon} size={36} strokeWidth={1.5} /> : null}
  </div>
);

export default StatCard;