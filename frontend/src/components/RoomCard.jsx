import React from 'react';
import styles from '../styles/RoomCard.module.css';
import badgeStyles from '../styles/Badge.module.css';

const RoomCard = ({ room }) => {
  if (!room) return null; // kiểm tra room trước khi render

  // Chọn class badge theo trạng thái
  let statusClass = '';
  switch (room.status) {
    case 'Available':
      statusClass = badgeStyles.success;
      break;
    case 'Occupied':
      statusClass = badgeStyles.occupied; // màu đỏ
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
          <h3>Phòng {room.number}</h3>
          <p>Tầng {room.floor} - {room.type}</p>
        </div>
      </div>

      {/* Hàng trạng thái + giá */}
      <div className={styles.statusPriceRow}>
        <span className={`${badgeStyles.badge} ${statusClass}`}>
          {room.status}
        </span>

        <span className={styles.price}>
          ${room.price}/đêm
        </span>
      </div>
    </div>

  );
};

export default RoomCard;
