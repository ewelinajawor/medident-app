import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Plus } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pl';
import { addToShoppingList, getAlertLevel } from '../utils/storage';
import { markNotificationsRead } from '../utils/notifications';
import './NotificationList.css';

dayjs.extend(relativeTime);
dayjs.locale('pl');

// Kolor paska po lewej: typ powiadomienia → ton
const TONE = {
  'critical-stock': 'danger',
  'low-stock': 'warning',
  'rfq-overdue': 'danger',
  'rfq-progress': 'info',
  'order-pending': 'info'
};

const LINK_LABEL = {
  Magazyn: 'Magazyn',
  Oferty: 'Otwórz zapytanie',
  'Zamówienia': 'Zamówienia'
};

/** Informuje menu (licznik nieprzeczytanych), że coś się zmieniło. */
export const notifyNotificationsChanged = () => window.dispatchEvent(new Event('notifications-changed'));

export function markRead(ids) {
  markNotificationsRead(ids);
  notifyNotificationsChanged();
}

/** Ilość do zamówienia dla powiadomienia magazynowego: do progu ostrzegawczego, min. 1. */
export function addNotificationItemToList(notification) {
  const { item } = notification;
  const quantity = Math.max(1, getAlertLevel(item) - item.quantity);
  addToShoppingList({ name: item.name, category: item.category, quantity });
  return quantity;
}

/**
 * Lista powiadomień – wspólna dla strony Powiadomienia i Strony głównej.
 * readIds: przeczytane id; onRead(id) – po oznaczeniu; onAddToList(notification) – „Dodaj do listy”.
 */
function NotificationList({ notifications, readIds, onRead, onAddToList, compact = false }) {
  return (
    <ul className={`ntf-list ${compact ? 'compact' : ''}`}>
      {notifications.map((n) => {
        const isRead = readIds.includes(n.id);
        return (
          <li key={n.id} className={`ntf-item tone-${TONE[n.type] || 'neutral'} ${isRead ? 'read' : 'unread'}`}>
            <span className="ntf-dot" aria-hidden="true" />
            <div className="ntf-body">
              <div className="ntf-head">
                <span className="ntf-title">{n.title}</span>
                <span className="ntf-time">{dayjs(n.date).fromNow()}</span>
              </div>
              <p className="ntf-message">{n.message}</p>
              {!compact && (
                <div className="ntf-meta">
                  <span className="badge">{n.category}</span>
                  {n.priority === 'high' && <span className="badge badge-danger">Pilne</span>}
                </div>
              )}
            </div>
            <div className="ntf-actions">
              {n.item && onAddToList && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onAddToList(n)}>
                  <Plus /> Do listy
                </button>
              )}
              {n.link && (
                <Link to={n.link} className="btn btn-ghost btn-sm" onClick={() => !isRead && onRead(n.id)}>
                  {LINK_LABEL[n.category] || 'Przejdź'} <ArrowRight />
                </Link>
              )}
              {!isRead && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm ntf-mark"
                  onClick={() => onRead(n.id)}
                  title="Oznacz jako przeczytane"
                  aria-label={`Oznacz jako przeczytane: ${n.title}`}
                >
                  <Check />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default NotificationList;
