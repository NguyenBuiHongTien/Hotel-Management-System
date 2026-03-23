import React from 'react';
import styles from '../styles/StatCard.module.css';

const StatCard = ({ title, value, icon: Icon, iconColor }) => (
  <div className={styles.card}>
    <div className={styles.info}>
      <p className={styles.title}>{title}</p>
      <p className={styles.value}>{value}</p>
    </div>
    <Icon className={iconColor} size={40} />
  </div>
);

export default StatCard;