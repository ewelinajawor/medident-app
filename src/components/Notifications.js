import React from 'react';
import './Notifications.css';

function Notifications() {
  // Przykładowe dane o produktach
  const lowStockProducts = [
    { id: 1, name: 'Masa wyciskowa A', quantity: 3, minStock: 5 },
    { id: 2, name: 'Narzędzie protetyczne X', quantity: 1, minStock: 2 },
    // Możesz dodać więcej produktów w niskim stanie
  ];

  return (
    <div className="notifications-container">
      <h3>Powiadomienia o produktach</h3>
      {lowStockProducts.length > 0 ? (
        <ul className="notifications-list">
          {lowStockProducts.map((product) => (
            <li key={product.id} className="notification-item">
              <p className="notification-text">
                {product.name} - Pozostało: {product.quantity}/{product.minStock}
              </p>
              <p className="automatic-note">Produkt został automatycznie dodany do listy zakupów.</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Brak produktów do dodania do listy zakupów</p>
      )}
    </div>
  );
}

export default Notifications;