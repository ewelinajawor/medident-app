import React from 'react';
import './Orders.css';

function Orders() {
  return (
    <div className="orders-container">
      <h2>Lista Zamówień</h2>

      <div className="orders-table">
        <table>
          <thead>
            <tr>
              <th>Numer Zamówienia</th>
              <th>Data Zamówienia</th>
              <th>Status</th>
              <th>Kwota</th>
            </tr>
          </thead>
          <tbody>
            {/* Przykładowe zamówienia */}
            <tr>
              <td>12345</td>
              <td>2025-01-28</td>
              <td className="status-in-progress">W trakcie</td>
              <td>100 PLN</td>
            </tr>
            <tr>
              <td>12346</td>
              <td>2025-01-27</td>
              <td className="status-delivered">Dostarczone</td>
              <td>150 PLN</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="add-order-button">
        <button>Nowe Zamówienie</button>
      </div>
    </div>
  );
}

export default Orders;
