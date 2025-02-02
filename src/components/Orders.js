import React, { useState } from 'react';
import './Orders.css';

function Orders() {
  const [activeTab, setActiveTab] = useState('newOrder'); // Domyślnie pokazujemy "Nowe zamówienie"
  const [orderHistory, setOrderHistory] = useState([
    { id: 1, date: '2025-01-28', items: ['Wypełnienie', 'Szczoteczki'], status: 'W trakcie', amount: '100 PLN' },
    { id: 2, date: '2025-01-27', items: ['Dezynfekcja', 'Rękawiczki'], status: 'Dostarczone', amount: '150 PLN' },
  ]); // Przykładowe dane historyczne

  const [filters, setFilters] = useState({
    date: '',
    status: 'all',
  });

  // Funkcja do zmiany aktywnej zakładki
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Funkcja do filtrowania historii zamówień
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredOrders = orderHistory.filter((order) => {
    const dateMatch = filters.date ? order.date === filters.date : true;
    const statusMatch = filters.status === 'all' ? true : order.status === filters.status;
    return dateMatch && statusMatch;
  });

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
      {activeTab === 'orderHistory' && (
        <div className="order-history">
          <h3>Historia zamówień</h3>

          {/* Filtry */}
          <div className="filters">
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              placeholder="Filtruj po dacie"
            />
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="all">Wszystkie</option>
              <option value="W trakcie">W trakcie</option>
              <option value="Dostarczone">Dostarczone</option>
            </select>
          </div>

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
              {filteredOrders.map((order) => (
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
