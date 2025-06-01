import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import './Notifications.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const Notifications = () => {
  const lowStockProducts = [
    {
      id: 1,
      type: 'critical-stock',
      message: 'Masa wyciskowa A ma krytycznie niski poziom zapasów.',
      date: '2025-05-31T08:00:00Z',
    },
    {
      id: 2,
      type: 'low-stock',
      message: 'Igły zbliżają się do minimalnego poziomu.',
      date: '2025-05-31T09:30:00Z',
    },
  ];

  const orderNotifications = [
    {
      id: 3,
      type: 'order-status',
      message: 'Zamówienie #456 zostało zrealizowane.',
      date: '2025-05-31T10:00:00Z',
    },
    {
      id: 4,
      type: 'order-status',
      message: 'Zamówienie #457 oczekuje na zatwierdzenie.',
      date: '2025-05-31T11:00:00Z',
    },
  ];

  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [readNotifications, setReadNotifications] = useState([]);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setNotifications([...lowStockProducts, ...orderNotifications]);
      setLoading(false);
    }, 500);
  }, []);

  const markAsRead = (id) => {
    if (!readNotifications.includes(id)) {
      setReadNotifications([...readNotifications, id]);
    }
  };

  const toggleSortOrder = () => {
    setSortNewestFirst(!sortNewestFirst);
  };

  const filtered = notifications.filter((n) =>
    activeFilter === 'all' ? true : n.type === activeFilter
  );

  const sorted = [...filtered].sort((a, b) =>
    sortNewestFirst
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (loading) return <div className="loading">⏳ Ładowanie powiadomień...</div>;

  return (
    <div className="notifications-container">
      <h2>🔔 Powiadomienia</h2>

      <div className="controls">
        <div className="filters">
          <button onClick={() => setActiveFilter('all')} className={activeFilter === 'all' ? 'active' : ''}>Wszystkie</button>
          <button onClick={() => setActiveFilter('order-status')} className={activeFilter === 'order-status' ? 'active' : ''}>Zamówienia</button>
          <button onClick={() => setActiveFilter('critical-stock')} className={activeFilter === 'critical-stock' ? 'active' : ''}>Krytyczne</button>
          <button onClick={() => setActiveFilter('low-stock')} className={activeFilter === 'low-stock' ? 'active' : ''}>Niskie</button>
        </div>
        <button className="sort" onClick={toggleSortOrder}>
          Sortuj: {sortNewestFirst ? 'Najnowsze' : 'Najstarsze'}
        </button>
      </div>

      <ul className="compact-list">
        {sorted.map((notification) => (
          <li
            key={notification.id}
            className={`compact-item ${readNotifications.includes(notification.id) ? 'read' : ''}`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="icon">
              {notification.type === 'order-status' ? (
                <FaCheckCircle className="order-icon" />
              ) : (
                <FaExclamationTriangle
                  className="stock-icon"
                  style={{ color: notification.type === 'critical-stock' ? '#d10000' : '#ff9900' }}
                />
              )}
            </div>
            <div className="text">
              <p className="message">{notification.message}</p>
              <span className="time">{dayjs(notification.date).fromNow()}</span>
            </div>
            {!readNotifications.includes(notification.id) && (
              <span className="badge">Nowe</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
