import React, { useState } from 'react';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Niski poziom zapasów: Rękawice jednorazowe', type: 'warning' },
    { id: 2, message: 'Zapas szczoteczek do zębów w normie', type: 'info' },
    { id: 3, message: 'Konieczność uzupełnienia zapasu materiałów stomatologicznych', type: 'critical' },
    { id: 4, message: 'Zapas środków czystości: Zadowalający', type: 'info' },
    { id: 5, message: 'Zapas płynów dezynfekujących - wkrótce się skończy', type: 'warning' },
  ]);

  return (
    <div className="notifications-container">
      <h2>Powiadomienia</h2>
      <ul className="notifications-list">
        {notifications.map((notification) => (
          <li key={notification.id} className={`notification ${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'warning' && '⚠️'}
              {notification.type === 'critical' && '❗'}
            </span>
            {notification.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Notifications;
