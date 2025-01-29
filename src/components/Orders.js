import React, { useState } from 'react';
import './Orders.css';

function Orders() {
  const [activeTab, setActiveTab] = useState('newOrder'); // Domyślnie pokazujemy "Nowe zamówienie"
  const [orderHistory, setOrderHistory] = useState([
    { id: 1, date: '2025-01-28', items: ['Wypełnienie', 'Szczoteczki'], status: 'W trakcie', amount: '100 PLN' },
    { id: 2, date: '2025-01-27', items: ['Dezynfekcja', 'Rękawiczki'], status: 'Dostarczone', amount: '150 PLN' },
  ]); // Przykładowe dane historyczne

  // Funkcja do zmiany aktywnej zakładki
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="orders-container">
      <h2>Lista Zamówień</h2>

      {/* Przyciski nawigacyjne */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'newOrder' ? 'active' : ''}`}
          onClick={() => handleTabChange('newOrder')}
        >
          Stwórz zamówienie
        </button>
        <button
          className={`tab-button ${activeTab === 'orderHistory' ? 'active' : ''}`}
          onClick={() => handleTabChange('orderHistory')}
        >
          Historia zamówień
        </button>
        <button
          className={`tab-button ${activeTab === 'modifyOrder' ? 'active' : ''}`}
          onClick={() => handleTabChange('modifyOrder')}
        >
          Modyfikacja listy zakupów
        </button>
      </div>

      {/* Zawartość w zależności od aktywnej zakładki */}
      {activeTab === 'newOrder' && (
        <div className="create-order">
          <h3>Tworzenie nowego zamówienia</h3>
          <button className="action-btn">Stwórz zamówienie</button>
        </div>
      )}

      {activeTab === 'orderHistory' && (
        <div className="order-history">
          <h3>Historia zamówień</h3>
          <table className="history-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Zamówione produkty</th>
                <th>Status</th>
                <th>Kwota</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map((order) => (
                <tr key={order.id}>
                  <td>{order.date}</td>
                  <td>{order.items.join(', ')}</td>
                  <td className={order.status === 'W trakcie' ? 'status-in-progress' : 'status-delivered'}>
                    {order.status}
                  </td>
                  <td>{order.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'modifyOrder' && (
        <div className="modify-order">
          <h3>Edytowanie listy zakupów</h3>
          <button className="action-btn">Edytuj listę zakupów</button>
        </div>
      )}
    </div>
  );
}

export default Orders;
