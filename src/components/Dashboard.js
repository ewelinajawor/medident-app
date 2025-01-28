import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function Dashboard({ username }) {
  // Przykładowe dane
  const inventoryStatus = "Wystarczająco";  // Stan zapasów
  const inventoryLevel = 100;  // Poziom zapasów

  const orderCount = 3;  // Liczba zamówień
  const orderStatus = "W trakcie";  // Status zamówienia

  const savingsStatus = "Dobre";  // Stan oszczędności
  const savingsAmount = 1500;  // Kwota oszczędności

  return (
    <div className="dashboard-container">
      <h2 className="welcome-message">Witaj, {username}!</h2>

      <div className="tiles">
        {/* Kafelki */}
        <div className="tile tile-ok">
          <h3>Aktualne zapasy</h3>
          <p>Stan zapasów: {inventoryStatus}</p>
          <p>Poziom zapasów: {inventoryLevel}</p>
          <Link to="/inventory">
            <button>Zarządzaj zapasami</button>
          </Link>
        </div>

        <div className="tile tile-warning">
          <h3>Przyszłe wydatki</h3>
          <p>Stan: Do zaplanowania</p>
          <Link to="/shopping-list">
            <button>Lista zakupów</button>
          </Link>
        </div>

        <div className="tile tile-critical">
          <h3>Ostatnie zamówienia</h3>
          <p>{orderCount} zamówień w {orderStatus}</p>
          <Link to="/orders">
            <button>Przejdź do zamówień</button>
          </Link>
        </div>

        <div className="tile tile-upcoming-expenses">
          <h3>Oszczędności</h3>
          <p>Stan oszczędności: {savingsStatus}</p>
          <p>Kwota: {savingsAmount} PLN</p>
          <Link to="/savings">
            <button>Przejdź do oszczędności</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
