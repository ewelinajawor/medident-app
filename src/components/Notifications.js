import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Package, 
  ShoppingCart, 
  Filter,
  Bell,
  X,
  ChevronDown
} from 'lucide-react';
import './Notifications.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pl';

dayjs.extend(relativeTime);
dayjs.locale('pl');

const Notifications = () => {
  const mockNotifications = [
    {
      id: 1,
      type: 'critical-stock',
      title: 'Krytycznie niski stan magazynowy',
      message: 'Masa wyciskowa A ma krytycznie niski poziom zapasów (tylko 2 szt.)',
      date: '2025-05-31T08:00:00Z',
      priority: 'high',
      category: 'Magazyn'
    },
    {
      id: 2,
      type: 'low-stock',
      title: 'Niski stan magazynowy',
      message: 'Igły endodontyczne zbliżają się do minimalnego poziomu (5 szt.)',
      date: '2025-05-31T09:30:00Z',
      priority: 'medium',
      category: 'Magazyn'
    },
    {
      id: 3,
      type: 'order-completed',
      title: 'Zamówienie zrealizowane',
      message: 'Zamówienie #456 zostało dostarczone i odebrane.',
      date: '2025-05-31T10:00:00Z',
      priority: 'low',
      category: 'Zamówienia'
    },
    {
      id: 4,
      type: 'order-pending',
      title: 'Zamówienie oczekuje',
      message: 'Zamówienie #457 oczekuje na zatwierdzenie przez dostawcę.',
      date: '2025-05-31T11:00:00Z',
      priority: 'medium',
      category: 'Zamówienia'
    },
    {
      id: 5,
      type: 'system',
      title: 'Aktualizacja systemu',
      message: 'Zaplanowana konserwacja systemu odbędzie się jutro o 02:00.',
      date: '2025-05-30T14:00:00Z',
      priority: 'low',
      category: 'System'
    }
  ];

  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [readNotifications, setReadNotifications] = useState([]);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 800);
  }, []);

  const markAsRead = (id) => {
    if (!readNotifications.includes(id)) {
      setReadNotifications([...readNotifications, id]);
    }
  };

  const markAllAsRead = () => {
    const unreadIds = notifications
      .filter(n => !readNotifications.includes(n.id))
      .map(n => n.id);
    setReadNotifications([...readNotifications, ...unreadIds]);
  };

  const toggleSortOrder = () => {
    setSortNewestFirst(!sortNewestFirst);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'critical-stock':
        return <AlertTriangle className="notification-icon critical" />;
      case 'low-stock':
        return <Package className="notification-icon warning" />;
      case 'order-completed':
        return <CheckCircle className="notification-icon success" />;
      case 'order-pending':
        return <Clock className="notification-icon info" />;
      case 'system':
        return <Bell className="notification-icon info" />;
      default:
        return <Bell className="notification-icon info" />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-low';
    }
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !readNotifications.includes(n.id);
    return n.type.includes(activeFilter);
  });

  const sorted = [...filtered].sort((a, b) =>
    sortNewestFirst
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const unreadCount = notifications.filter(n => !readNotifications.includes(n.id)).length;

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner"></div>
        <p>Ładowanie powiadomień...</p>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      {/* Header */}
      <div className="notifications-header">
        <div className="header-title">
          <Bell className="header-icon" />
          <h1>Powiadomienia</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="mark-all-read">
              Oznacz wszystkie jako przeczytane
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="notifications-controls">
        <div className="controls-left">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
          >
            <Filter className="icon" />
            Filtry
            <ChevronDown className={`chevron ${showFilters ? 'rotated' : ''}`} />
          </button>
        </div>
        
        <div className="controls-right">
          <button onClick={toggleSortOrder} className="sort-toggle">
            <Clock className="icon" />
            {sortNewestFirst ? 'Najnowsze pierwsze' : 'Najstarsze pierwsze'}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label className="filter-label">Typ powiadomień</label>
            <div className="filter-buttons">
              <button 
                onClick={() => setActiveFilter('all')} 
                className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              >
                Wszystkie
              </button>
              <button 
                onClick={() => setActiveFilter('unread')} 
                className={`filter-btn ${activeFilter === 'unread' ? 'active' : ''}`}
              >
                Nieprzeczytane ({unreadCount})
              </button>
              <button 
                onClick={() => setActiveFilter('stock')} 
                className={`filter-btn ${activeFilter === 'stock' ? 'active' : ''}`}
              >
                Magazyn
              </button>
              <button 
                onClick={() => setActiveFilter('order')} 
                className={`filter-btn ${activeFilter === 'order' ? 'active' : ''}`}
              >
                Zamówienia
              </button>
              <button 
                onClick={() => setActiveFilter('system')} 
                className={`filter-btn ${activeFilter === 'system' ? 'active' : ''}`}
              >
                System
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="notifications-list">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <Bell className="empty-icon" />
            <h3>Brak powiadomień</h3>
            <p>Nie ma powiadomień spełniających wybrane kryteria.</p>
          </div>
        ) : (
          sorted.map((notification) => {
            const isRead = readNotifications.includes(notification.id);
            return (
              <div
                key={notification.id}
                className={`notification-item ${isRead ? 'read' : 'unread'} ${getPriorityClass(notification.priority)}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="notification-icon-wrapper">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h3 className="notification-title">{notification.title}</h3>
                    <span className="notification-category">{notification.category}</span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-footer">
                    <span className="notification-time">
                      {dayjs(notification.date).fromNow()}
                    </span>
                    <span className={`priority-indicator ${getPriorityClass(notification.priority)}`}>
                      {notification.priority === 'high' && 'Wysoki priorytet'}
                      {notification.priority === 'medium' && 'Średni priorytet'}
                      {notification.priority === 'low' && 'Niski priorytet'}
                    </span>
                  </div>
                </div>

                {!isRead && (
                  <div className="unread-indicator">
                    <span className="unread-dot"></span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {sorted.length > 0 && (
        <div className="notifications-summary">
          <span className="summary-text">
            Wyświetlane: {sorted.length} z {notifications.length} powiadomień
          </span>
        </div>
      )}
    </div>
  );
};

export default Notifications;