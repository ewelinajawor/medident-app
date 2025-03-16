import React from 'react';
import { Link } from 'react-router-dom';
import { FaBox, FaClipboardList, FaPiggyBank, FaHandshake, FaShoppingCart, FaChartLine } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './Dashboard.css';

// Zarejestruj wymagane elementy
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard({ username }) {
  // Dane dla wykresu
  const chartData = {
    labels: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec'],
    datasets: [
      {
        label: 'Liczba zamówień',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: '#3498DB', // Niebieski
        borderColor: '#2C3E50', // Granatowy
        borderWidth: 1,
      },
      {
        label: 'Oszczędności (w PLN)',
        data: [500, 800, 1200, 900, 1500, 2000],
        backgroundColor: '#1ABC9C', // Miętowy
        borderColor: '#16A085', // Ciemniejszy miętowy
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#ECF0F1', // Jasny szary dla siatki
        },
        ticks: {
          color: '#2C3E50', // Granatowy dla tekstu na osi Y
        },
      },
      x: {
        grid: {
          color: '#ECF0F1', // Jasny szary dla siatki
        },
        ticks: {
          color: '#2C3E50', // Granatowy dla tekstu na osi X
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#2C3E50', // Granatowy dla tekstu legendy
        },
      },
      title: {
        display: true,
        text: 'Statystyki zamówień i oszczędności',
        color: '#2C3E50', // Granatowy dla tytułu
        font: {
          size: 18,
        },
      },
      tooltip: {
        backgroundColor: '#2C3E50', // Granatowe tło tooltipa
        titleColor: '#FFFFFF', // Biały kolor tytułu tooltipa
        bodyColor: '#FFFFFF', // Biały kolor tekstu tooltipa
      },
    },
    animation: {
      duration: 1000, // Dłuższa animacja
      easing: 'easeInOutQuart', // Płynne przejście
    },
  };

  return (
    <div className="dashboard-container">
      <h2 className="welcome-message">Witaj, {username}!</h2>

      {/* Sekcja szybkich akcji */}
      <div className="quick-actions">
        <Link to="/add-product" style={{ textDecoration: 'none' }}>
          <button className="quick-action-button">
            <FaBox /> Dodaj produkt
          </button>
        </Link>
        <Link to="/create-order" style={{ textDecoration: 'none' }}>
          <button className="quick-action-button">
            <FaShoppingCart /> Złóż zamówienie
          </button>
        </Link>
      </div>

      <div className="tiles">
        {/* Kafelek Magazyn */}
        <div className="tile tile-inventory">
          <div className="tile-icon">
            <FaBox size={48} /> {/* Większa ikona */}
          </div>
          <h3>Magazyn</h3>
          <Link to="/inventory" style={{ textDecoration: 'none' }}>
            <button className="tile-button">
              <FaBox /> Zarządzaj zapasami
            </button>
          </Link>
        </div>

        {/* Kafelek Zamówienia */}
        <div className="tile tile-orders">
          <div className="tile-icon">
            <FaClipboardList size={48} /> {/* Większa ikona */}
          </div>
          <h3>Zamówienia</h3>
          <div className="tile-buttons">
            <Link to="/shopping-list" style={{ textDecoration: 'none' }}>
              <button className="tile-button">
                <FaShoppingCart /> Lista zakupów
              </button>
            </Link>
            <Link to="/orders" style={{ textDecoration: 'none' }}>
              <button className="tile-button" style={{ marginTop: '15px' }}>
                <FaChartLine /> Przejdź do zamówień
              </button>
            </Link>
          </div>
        </div>

        {/* Kafelek Oszczędności */}
        <div className="tile tile-savings">
          <div className="tile-icon">
            <FaPiggyBank size={48} /> {/* Większa ikona */}
          </div>
          <h3>Oszczędności</h3>
          <Link to="/savings" style={{ textDecoration: 'none' }}>
            <button className="tile-button">
              <FaPiggyBank /> Zarządzaj oszczędnościami
            </button>
          </Link>
        </div>

        {/* Kafelek Oferty */}
        <div className="tile tile-offers">
          <div className="tile-icon">
            <FaHandshake size={48} /> {/* Większa ikona */}
          </div>
          <h3>Oferty</h3>
          <Link to="/offers" style={{ textDecoration: 'none' }}>
            <button className="tile-button">
              <FaHandshake /> Analizuj oferty
            </button>
          </Link>
        </div>
      </div>

      {/* Sekcja wykresu */}
      <div className="chart-container">
        <h3>Statystyki zamówień i oszczędności</h3>
        <div className="chart-wrapper">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;