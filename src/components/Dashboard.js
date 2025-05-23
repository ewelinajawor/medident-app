import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBox,
  FaClipboardList,
  FaPiggyBank,
  FaHandshake,
  FaShoppingCart,
  FaCalendarAlt
} from 'react-icons/fa';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import './Dashboard.css';
import EventCalendar from './EventCalendar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard({ username }) {
  const navigate = useNavigate();
  const [lowStockItems, setLowStockItems] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [todayEvents, setTodayEvents] = useState([]);
  const [inventorySummary, setInventorySummary] = useState({
    normal: 0,
    low: 0,
    critical: 0
  });

  useEffect(() => {
    setLowStockItems([
      { id: 1, name: 'Masa wyciskowa', stock: 2, minStock: 5, category: 'Materiały', price: 50 },
      { id: 2, name: 'Narzędzia protetyczne', stock: 1, minStock: 5, category: 'Sprzęt', price: 200 },
      { id: 3, name: 'Nożyczki chirurgiczne', stock: 1, minStock: 3, category: 'Sprzęt', price: 75 },
    ]);
    setPendingOrders([
      { id: 1, date: '15.03.2025', supplier: 'Koldental', items: 5, status: 'W realizacji' },
      { id: 2, date: '18.03.2025', supplier: 'Meditrans', items: 3, status: 'Oczekujące' },
    ]);
    const storedEvents = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todaysEvents = storedEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate < tomorrow;
    });
    setTodayEvents(todaysEvents.map(event => ({
      id: event.id,
      time: new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: event.title,
      type: event.type,
      description: event.description
    })));
    setInventorySummary({
      normal: 42,
      low: 8,
      critical: 3
    });
  }, []);

  const handleEventAdded = (events) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todaysEvents = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate < tomorrow;
    });
    setTodayEvents(todaysEvents.map(event => ({
      id: event.id,
      time: new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: event.title,
      type: event.type,
      description: event.description
    })));
  };

  const addToShoppingList = (item) => {
    const currentShoppingList = JSON.parse(localStorage.getItem('products')) || [];
    const existingItemIndex = currentShoppingList.findIndex(
      (product) => product.name === item.name
    );
    const stockDifference = item.minStock - item.stock;
    const quantityToAdd = stockDifference > 0 ? stockDifference : 1;
    if (existingItemIndex !== -1) {
      currentShoppingList[existingItemIndex].quantity += quantityToAdd;
    } else {
      const newItem = {
        name: item.name,
        category: item.category,
        quantity: quantityToAdd,
        dateAdded: new Date().toLocaleDateString(),
        price: item.price || 0
      };
      currentShoppingList.push(newItem);
    }
    localStorage.setItem('products', JSON.stringify(currentShoppingList));
  };

  const orderChartData = {
    labels: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec'],
    datasets: [
      {
        label: 'Liczba zamówień',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: '#3498DB',
        borderColor: '#2C3E50',
        borderWidth: 1,
      },
      {
        label: 'Oszczędności (w PLN)',
        data: [500, 800, 1200, 900, 1500, 2000],
        backgroundColor: '#1ABC9C',
        borderColor: '#16A085',
        borderWidth: 1,
      },
    ],
  };

  const orderChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#ECF0F1' },
        ticks: { color: '#2C3E50' },
      },
      x: {
        grid: { color: '#ECF0F1' },
        ticks: { color: '#2C3E50' },
      },
    },
    plugins: {
      legend: { position: 'top', labels: { color: '#2C3E50' } },
      title: {
        display: true,
        text: 'Statystyki zamówień i oszczędności',
        color: '#2C3E50',
        font: { size: 18 },
      },
      tooltip: {
        backgroundColor: '#2C3E50',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
      },
    },
  };

  const inventoryChartData = {
    labels: ['Dobry stan', 'Niski stan', 'Stan krytyczny'],
    datasets: [
      {
        data: [inventorySummary.normal, inventorySummary.low, inventorySummary.critical],
        backgroundColor: ['#2ECC71', '#F1C40F', '#E74C3C'],
        borderColor: ['#27AE60', '#F39C12', '#C0392B'],
        borderWidth: 1,
      },
    ],
  };

  const inventoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#2C3E50' } },
      title: {
        display: true,
        text: 'Stan magazynowy',
        color: '#2C3E50',
        font: { size: 18 },
      },
      tooltip: {
        backgroundColor: '#2C3E50',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
      },
    },
  };

  const quickTiles = (
    <div className="tiles">
      <div className="tile tile-inventory">
        <div className="tile-content">
          <div className="tile-icon"><FaBox size={48} /></div>
          <h3>Magazyn</h3>
          <div className="tile-data">
            <div className="tile-stat">
              <span className="tile-label">Niski stan:</span>
              <span className="tile-value warning">{inventorySummary.low}</span>
            </div>
            <div className="tile-stat">
              <span className="tile-label">Krytyczny:</span>
              <span className="tile-value danger">{inventorySummary.critical}</span>
            </div>
          </div>
        </div>
        <div className="tile-button-wrapper">
          <Link to="/inventory">
            <button className="tile-button"><FaBox /> Zarządzaj zapasami</button>
          </Link>
        </div>
      </div>
      <div className="tile tile-orders">
        <div className="tile-content">
          <div className="tile-icon"><FaClipboardList size={48} /></div>
          <h3>Zamówienia</h3>
          <div className="tile-data">
            <div className="tile-stat">
              <span className="tile-label">Oczekujące:</span>
              <span className="tile-value info">{pendingOrders.length}</span>
            </div>
          </div>
        </div>
        <div className="tile-button-wrapper">
          <Link to="/shopping-list">
            <button className="tile-button"><FaShoppingCart /> Lista zakupów</button>
          </Link>
        </div>
      </div>
      <div className="tile tile-offers">
        <div className="tile-content">
          <div className="tile-icon"><FaHandshake size={48} /></div>
          <h3>Oferty</h3>
          <div className="tile-data">
            <div className="tile-stat">
              <span className="tile-label">Nowe:</span>
              <span className="tile-value info">3</span>
            </div>
          </div>
        </div>
        <div className="tile-button-wrapper">
          <Link to="/offers">
            <button className="tile-button"><FaHandshake /> Analizuj oferty</button>
          </Link>
        </div>
      </div>
      <div className="tile tile-savings">
        <div className="tile-content">
          <div className="tile-icon"><FaPiggyBank size={48} /></div>
          <h3>Oszczędności</h3>
          <div className="tile-data">
            <div className="tile-stat">
              <span className="tile-label">Miesięcznie:</span>
              <span className="tile-value success">2000 zł</span>
            </div>
          </div>
        </div>
        <div className="tile-button-wrapper">
          <Link to="/savings">
            <button className="tile-button"><FaPiggyBank /> Zarządzaj oszczędnościami</button>
          </Link>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
          <div className="tab-content">
            <h3 className="section-title">Kalendarz</h3>
            <EventCalendar onEventAdded={handleEventAdded} />
          </div>
        );
      case 'inventory':
        return (
          <div className="tab-content">
            <h3 className="section-title">Stan magazynowy</h3>
            <div className="inventory-summary">
              <div className="summary-item good-stock">
                <span>Dobry stan</span>
                <strong>{inventorySummary.normal}</strong>
              </div>
              <div className="summary-item low-stock">
                <span>Niski stan</span>
                <strong>{inventorySummary.low}</strong>
              </div>
              <div className="summary-item critical-stock">
                <span>Stan krytyczny</span>
                <strong>{inventorySummary.critical}</strong>
              </div>
            </div>
            <div className="inventory-chart-container">
              <div className="chart-wrapper chart-small">
                <Doughnut data={inventoryChartData} options={inventoryChartOptions} />
              </div>
            </div>
            <h3 className="section-title">Produkty wymagające uwagi</h3>
            {lowStockItems.length > 0 ? (
              <div className="low-stock-table-container">
                <div className="low-stock-actions">
                  <button
                    className="add-all-to-list-button"
                    onClick={() => lowStockItems.forEach(item => addToShoppingList(item))}
                  >
                    <FaShoppingCart /> Dodaj wszystkie do listy
                  </button>
                </div>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Nazwa produktu</th>
                      <th>Kategoria</th>
                      <th>Stan</th>
                      <th>Min. stan</th>
                      <th>Brakuje</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map(item => {
                      const shortage = item.minStock - item.stock;
                      return (
                        <tr key={item.id} className={item.stock < item.minStock * 0.5 ? 'critical-row' : 'warning-row'}>
                          <td>{item.name}</td>
                          <td>{item.category}</td>
                          <td>{item.stock}</td>
                          <td>{item.minStock}</td>
                          <td>{shortage > 0 ? shortage : 0}</td>
                          <td>
                            <button className="small-button" onClick={() => addToShoppingList(item)}>Zamów</button>
                            <button className="small-button view-button" onClick={() => navigate('/shopping-list')}>Lista</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-message">Wszystkie produkty mają wystarczający stan magazynowy.</p>
            )}
            <div className="action-buttons">
              <Link to="/inventory">
                <button className="primary-button"><FaBox /> Przejdź do magazynu</button>
              </Link>
              <Link to="/shopping-list">
                <button className="secondary-button"><FaShoppingCart /> Przejdź do listy zakupów</button>
              </Link>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="tab-content">
            <h3 className="section-title">Podsumowanie zamówień</h3>
            <div className="order-chart-container">
              <div className="chart-wrapper">
                <Bar data={orderChartData} options={orderChartOptions} />
              </div>
            </div>
            <h3 className="section-title">Oczekujące zamówienia</h3>
            {pendingOrders.length > 0 ? (
              <div className="pending-orders-container">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Data</th>
                      <th>Dostawca</th>
                      <th>Liczba produktów</th>
                      <th>Status</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.date}</td>
                        <td>{order.supplier}</td>
                        <td>{order.items}</td>
                        <td>
                          <span className={`status-badge ${order.status === 'W realizacji' ? 'status-in-progress' : 'status-pending'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/orders/${order.id}`}>
                            <button className="small-button">Szczegóły</button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-message">Brak oczekujących zamówień.</p>
            )}
            <div className="action-buttons">
              <Link to="/shopping-list">
                <button className="primary-button"><FaShoppingCart /> Złóż nowe zamówienie</button>
              </Link>
              <Link to="/orders">
                <button className="secondary-button"><FaClipboardList /> Wszystkie zamówienia</button>
              </Link>
            </div>
          </div>
        );
      default:
        return (
          <div className="tab-content">
            <div className="today-panel">
              <div className="today-header">
                <FaCalendarAlt />
                <h3>Dzisiaj - {new Date().toLocaleDateString()}</h3>
                <button className="add-event-small-button" onClick={() => setActiveTab('calendar')}>
                  <FaCalendarAlt /> Dodaj
                </button>
              </div>
              {todayEvents.length > 0 ? (
                <div className="events-list">
                  {todayEvents.map(event => (
                    <div key={event.id} className={`event-item event-${event.type}`}>
                      <div className="event-time">{event.time}</div>
                      <div className="event-content">
                        <div className="event-title">{event.title}</div>
                        {event.description && (
                          <div className="event-description">{event.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="event-actions">
                    <button className="secondary-button" onClick={() => setActiveTab('calendar')}>
                      <FaCalendarAlt /> Zarządzaj kalendarzem
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="empty-message">Brak zaplanowanych wydarzeń na dziś.</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <h2 className="welcome-message">Witaj, {username || 'Użytkowniku'}!</h2>
      {quickTiles}
      <div className="dashboard-tabs">
        <button className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Przegląd
        </button>
        <button className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          Magazyn
        </button>
        <button className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          Zamówienia
        </button>
        <button className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <FaCalendarAlt style={{ marginRight: '5px' }} /> Kalendarz
        </button>
      </div>
      {renderTabContent()}
    </div>
  );
}

export default Dashboard;
