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

  const offersStatus = "Oczekiwanie";  // Status ofert
  const offersAmount = 2;  // Liczba ofert

  return (
    <div className="dashboard-container">
      <h2 className="welcome-message">Witaj, {username}!</h2>

      <div className="tiles">
        {/* Kafelki */}
        <div className="tile tile-ok">
          <h3>Magazyn</h3>
          <p>Stan zapasów: {inventoryStatus}</p>
          <p>Poziom zapasów: {inventoryLevel}</p>
          <Link to="/inventory">
            <button>Zarządzaj zapasami</button>
          </Link>
        </div>

        <div className="tile tile-warning">
          <h3>Lista zamówień</h3>
          <p>Ostatnie zamówienie: {orderCount} zamówień w {orderStatus}</p>
          <Link to="/shopping-list">
            <button>Lista zakupów</button>
          </Link>
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

        <div className="tile tile-offers">
          <h3>Oferty</h3>
          <p>Otrzymano {offersAmount} ofert</p>
          <p>Status: {offersStatus}</p>
          <Link to="/offers">
            <button>Analizuj oferty</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
