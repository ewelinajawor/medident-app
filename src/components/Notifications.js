import React, { useState } from 'react';
import { ArrowDownUp } from 'lucide-react';
import './Notifications.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pl';

dayjs.extend(relativeTime);
dayjs.locale('pl');

// Przykładowe powiadomienia (do zastąpienia prawdziwymi danymi).
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

const Notifications = () => {

  const [notifications] = useState(mockNotifications);
  const [activeFilter, setActiveFilter] = useState('all');
  const [readNotifications, setReadNotifications] = useState([]);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

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

  const TONE = {
    'critical-stock': 'danger',
    'low-stock': 'warning',
    'order-completed': 'success',
    'order-pending': 'info',
    system: 'neutral'
  };

  const PRIORITY_LABEL = { high: 'Wysoki priorytet', medium: 'Średni priorytet', low: 'Niski priorytet' };

  const FILTERS = [
    { id: 'all', label: 'Wszystkie' },
    { id: 'unread', label: `Nieprzeczytane (${unreadCount})` },
    { id: 'stock', label: 'Magazyn' },
    { id: 'order', label: 'Zamówienia' },
    { id: 'system', label: 'System' }
  ];

  return (
    <div className="notifications page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Powiadomienia</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} nieprzeczytane` : 'Wszystko przeczytane'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-secondary">
            Oznacz wszystkie jako przeczytane
          </button>
        )}
      </header>

      <div className="ntf-toolbar">
        <div className="ntf-filters" role="group" aria-label="Filtruj powiadomienia">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`ntf-filter ${activeFilter === f.id ? 'active' : ''}`}
              aria-pressed={activeFilter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={toggleSortOrder} className="btn btn-ghost btn-sm">
          <ArrowDownUp /> {sortNewestFirst ? 'Najnowsze najpierw' : 'Najstarsze najpierw'}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <h3>Brak powiadomień</h3>
          <p>Nie ma powiadomień spełniających wybrane kryteria.</p>
        </div>
      ) : (
        <ul className="ntf-list card">
          {sorted.map((notification) => {
            const isRead = readNotifications.includes(notification.id);
            return (
              <li
                key={notification.id}
                className={`ntf-item tone-${TONE[notification.type] || 'neutral'} ${isRead ? 'read' : 'unread'}`}
              >
                <button
                  type="button"
                  className="ntf-row"
                  onClick={() => markAsRead(notification.id)}
                  aria-label={isRead ? undefined : `${notification.title} – oznacz jako przeczytane`}
                >
                  <span className="ntf-dot" aria-hidden="true" />
                  <span className="ntf-body">
                    <span className="ntf-head">
                      <span className="ntf-title">{notification.title}</span>
                      <span className="ntf-time">{dayjs(notification.date).fromNow()}</span>
                    </span>
                    <span className="ntf-message">{notification.message}</span>
                    <span className="ntf-meta">
                      <span className="badge">{notification.category}</span>
                      {notification.priority === 'high' && (
                        <span className="badge badge-danger">{PRIORITY_LABEL.high}</span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {sorted.length > 0 && (
        <p className="ntf-summary muted">
          Wyświetlane: {sorted.length} z {notifications.length}
        </p>
      )}
    </div>
  );
};

export default Notifications;
