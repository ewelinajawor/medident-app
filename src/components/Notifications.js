import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaBell, FaCheck, FaShoppingCart } from 'react-icons/fa';
import './Notifications.css';

function Notifications() {
  // Stan komponentu
  const [notifications, setNotifications] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // Symulacja danych o produktach
  const lowStockProducts = [
    { 
      id: 1, 
      name: 'Masa wyciskowa A', 
      quantity: 3, 
      minStock: 5, 
      type: 'low-stock',
      time: '2h temu',
      status: 'added'
    },
    { 
      id: 2, 
      name: 'Narzędzie protetyczne X', 
      quantity: 1, 
      minStock: 2, 
      type: 'critical-stock',
      time: '4h temu',
      status: 'pending'
    }
  ];

  const orderNotifications = [
    {
      id: 101,
      name: 'Zamówienie #3245',
      type: 'order-status',
      status: 'delivered',
      time: '1h temu',
      message: 'Dostarczono'
    }
  ];

  // Łączenie wszystkich powiadomień
  useEffect(() => {
    const allNotifications = [...lowStockProducts, ...orderNotifications];
    setNotifications(allNotifications);
  }, []);

  // Filtrowanie powiadomień
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'stock') return notification.type === 'low-stock' || notification.type === 'critical-stock';
    return notification.type === filter;
  });

  // Wyświetlana lista powiadomień (wszystkie lub tylko kilka najnowszych)
  const displayedNotifications = showAll 
    ? filteredNotifications 
    : filteredNotifications.slice(0, 3);

  // Funkcja renderująca ikony zależnie od typu powiadomienia
  const renderNotificationIcon = (type, status) => {
    if (type === 'low-stock' || type === 'critical-stock') {
      return <FaExclamationTriangle className={`notification-icon ${type}`} />;
    } else if (type === 'order-status') {
      if (status === 'delivered') {
        return <FaCheck className="notification-icon order-delivered" />;
      } else {
        return <FaBell className="notification-icon order-processing" />;
      }
    }
    return <FaBell className="notification-icon" />;
  };

  // Funkcja renderująca przycisk akcji (bardziej kompaktowy)
  const renderActionButton = (notification) => {
    if (notification.type === 'low-stock' || notification.type === 'critical-stock') {
      if (notification.status === 'pending') {
        return (
          <button className="action-button add-to-cart-button">
            <FaShoppingCart /> Dodaj
          </button>
        );
      } else {
        return (
          <span className="status-badge added-to-cart">
            <FaCheck /> Dodano
          </span>
        );
      }
    } else if (notification.type === 'order-status') {
      return (
        <Link to={`/orders/${notification.id}`} className="action-link">
          Szczegóły
        </Link>
      );
    }
    return null;
  };

  // Funkcja renderująca treść powiadomienia (bardziej zwięzłą)
  const renderNotificationContent = (notification) => {
    if (notification.type === 'low-stock' || notification.type === 'critical-stock') {
      return (
        <>
          <p className="notification-title">{notification.name}</p>
          <p className="notification-text">
            Stan: <span className={notification.type === 'critical-stock' ? 'critical-text' : 'warning-text'}>
              {notification.quantity}/{notification.minStock}
            </span>
          </p>
        </>
      );
    } else if (notification.type === 'order-status') {
      return (
        <>
          <p className="notification-title">{notification.name}</p>
          <p className="notification-text">{notification.message}</p>
        </>
      );
    }
    return <p className="notification-text">{notification.name}</p>;
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h3>Powiadomienia</h3>
        <div className="filter-controls">
          <button 
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Wszystkie
          </button>
          <button 
            className={`filter-button ${filter === 'stock' ? 'active' : ''}`}
            onClick={() => setFilter('stock')}
          >
            Magazyn
          </button>
          <button 
            className={`filter-button ${filter === 'order-status' ? 'active' : ''}`}
            onClick={() => setFilter('order-status')}
          >
            Zamówienia
          </button>
        </div>
      </div>

      {displayedNotifications.length > 0 ? (
        <ul className="notifications-list">
          {displayedNotifications.map((notification) => (
            <li key={notification.id} className={`notification-item ${notification.type}`}>
              <div className="notification-icon-wrapper">
                {renderNotificationIcon(notification.type, notification.status)}
              </div>
              <div className="notification-content">
                {renderNotificationContent(notification)}
                <p className="notification-time">{notification.time}</p>
              </div>
              <div className="notification-actions">
                {renderActionButton(notification)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-notifications">
          <p>Brak powiadomień</p>
        </div>
      )}

      {notifications.length > 3 && (
        <div className="show-more-container">
          <button className="show-more-button" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Pokaż mniej' : `Pokaż wszystkie (${notifications.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

export default Notifications;