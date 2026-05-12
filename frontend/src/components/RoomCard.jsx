import React from 'react';
import styles from '../styles/RoomCard.module.css';
import badgeStyles from '../styles/Badge.module.css';

const RoomCard = ({ room }) => {
  if (!room) return null;

  let statusClass = '';
  switch (room.status) {
    case 'Available':
      statusClass = badgeStyles.success;
      break;
    case 'Occupied':
      statusClass = badgeStyles.occupied;
      break;
    case 'Maintenance':
      statusClass = badgeStyles.warning;
      break;
    default:
      statusClass = '';
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.roomInfo}>
          <h3>Room {room.number}</h3>
          <p>Floor {room.floor} — {room.type}</p>
        </div>
      </div>

      <div className={styles.statusPriceRow}>
        <span className={`${badgeStyles.badge} ${statusClass}`}>
          {room.status}
        </span>

        <span className={styles.price}>
          ${room.price}/night
        </span>
      </div>
    </div>

  );
};

export default RoomCard;
