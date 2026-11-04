import React, { useState } from 'react';
import { ArrowDownUp } from 'lucide-react';
import { buildNotifications, getReadNotificationIds } from '../utils/notifications';
import NotificationList, { markRead, addNotificationItemToList } from './NotificationList';
import './Notifications.css';

const CATEGORY_FILTERS = ['Magazyn', 'Oferty', 'Zamówienia'];

const Notifications = () => {
  // Powiadomienia wynikają z bieżącego stanu magazynu, zapytań ofertowych i zamówień.
  const [notifications] = useState(() => buildNotifications());
  const [readIds, setReadIds] = useState(() => getReadNotificationIds());
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortNewestFirst, setSortNewestFirst] = useState(false);
  const [message, setMessage] = useState('');

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const handleRead = (id) => {
    markRead([id]);
    setReadIds(getReadNotificationIds());
  };

  const markAllAsRead = () => {
    markRead(notifications.map((n) => n.id));
    setReadIds(getReadNotificationIds());
  };

  const handleAddToList = (notification) => {
    const quantity = addNotificationItemToList(notification);
    handleRead(notification.id);
    setMessage(`Dodano „${notification.item.name}” (${quantity} ${notification.item.unit || 'szt'}) do listy zakupów.`);
    setTimeout(() => setMessage(''), 4000);
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !readIds.includes(n.id);
    return n.category === activeFilter;
  });

  // Domyślnie kolejność „najważniejsze najpierw” (tak zwraca buildNotifications); opcjonalnie wg daty.
  const sorted = sortNewestFirst
    ? [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date))
    : filtered;

  const countFor = (category) => notifications.filter((n) => n.category === category).length;

  const FILTERS = [
    { id: 'all', label: 'Wszystkie' },
    { id: 'unread', label: `Nieprzeczytane (${unreadCount})` },
    ...CATEGORY_FILTERS.map((c) => ({ id: c, label: `${c} (${countFor(c)})` }))
  ];

  return (
    <div className="notifications page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Powiadomienia</h1>
          <p className="page-subtitle">
            {notifications.length === 0
              ? 'Nic nie wymaga uwagi'
              : unreadCount > 0
              ? `${unreadCount} nieprzeczytane z ${notifications.length}`
              : 'Wszystko przeczytane'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-secondary">
            Oznacz wszystkie jako przeczytane
          </button>
        )}
      </header>

      {message && <div className="notice" role="status">{message}</div>}

      {notifications.length === 0 ? (
        <div className="empty-state">
          <h3>Wszystko w porządku</h3>
          <p>Stany magazynowe są w normie, nie ma zaległych ofert ani zamówień w drodze.</p>
        </div>
      ) : (
        <>
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
            <button onClick={() => setSortNewestFirst(!sortNewestFirst)} className="btn btn-ghost btn-sm">
              <ArrowDownUp /> {sortNewestFirst ? 'Najnowsze najpierw' : 'Najważniejsze najpierw'}
            </button>
          </div>

          {sorted.length === 0 ? (
            <div className="empty-state">
              <h3>Brak powiadomień w tym widoku</h3>
              <p>Zmień filtr, aby zobaczyć pozostałe.</p>
            </div>
          ) : (
            <div className="card ntf-card">
              <NotificationList
                notifications={sorted}
                readIds={readIds}
                onRead={handleRead}
                onAddToList={handleAddToList}
              />
            </div>
          )}

          <p className="ntf-summary muted">
            Powiadomienia odświeżają się na podstawie magazynu, zapytań ofertowych i zamówień.
          </p>
        </>
      )}
    </div>
  );
};

export default Notifications;
