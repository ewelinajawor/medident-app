import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBox,          // Ikona dla Magazynu
  FaClipboardList, // Ikona dla Zamówień (może być też FaShoppingCart)
  FaPiggyBank,   // Ikona dla Oszczędności/Raportów
  FaHandshake,   // Ikona dla Ofert
  FaShoppingCart, // Ikona dla Listy Zakupów/Zamówień
  FaCalendarAlt,  // Ikona dla Kalendarza
  FaChartBar,     // Ikona dla Raportów (alternatywa dla FaPiggyBank)
  FaEye           // Ikona dla Przeglądu
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
// Importujemy tutaj biblioteki Firebase, jeśli zdecydujesz się na ich użycie.
// import { initializeApp } from 'firebase/app';
// import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
// import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Zamiast importować bezpośrednio, możesz stworzyć kontekst Firebase w głównym App.js
// i przekazywać go do komponentów, tak jak było w poprzedniej propozycji,
// aby uniknąć powtarzania inicjalizacji i problemów z uwierzytelnianiem.

import './Dashboard.css';
// Zauważ, że EventCalendar jest oddzielnym komponentem. To jest dobra praktyka!
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
  // Stan dla danych z Firebase (jeśli zostanie wdrożony)
  // const [db, setDb] = useState(null);
  // const [userId, setUserId] = useState(null);
  // const [loadingFirebase, setLoadingFirebase] = useState(true);

  const [lowStockItems, setLowStockItems] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [todayEvents, setTodayEvents] = useState([]);
  const [inventorySummary, setInventorySummary] = useState({
    normal: 0,
    low: 0,
    critical: 0
  });

  // Nowe stany dla filtrowania i sortowania zapasów
  const [inventoryFilter, setInventoryFilter] = useState('');
  const [inventorySortBy, setInventorySortBy] = useState('name'); // 'name', 'stock', 'category'
  const [inventorySortOrder, setInventorySortOrder] = useState('asc'); // 'asc', 'desc'

  // Nowy stan dla historii zmian
  const [historyEvents, setHistoryEvents] = useState([]);

  useEffect(() => {
    // --- PROPOZYCJA ZMIANY: Zamiast danych statycznych i localStorage, użyj Firebase Firestore ---
    // Poniższe dane powinny być pobierane z Firebase Firestore w czasie rzeczywistym.
    // To pozwoli na wspólną pracę, synchronizację między urządzeniami i trwałość danych.

    // Przykład pobierania danych z Firestore (wymaga Firebase setup w App.js i przekazania db/userId przez Context)
    /*
    if (db && userId) {
      // Pobieranie zapasów
      const inventoryRef = collection(db, `artifacts/${__app_id}/users/${userId}/inventory`);
      const unsubscribeInventory = onSnapshot(inventoryRef, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLowStockItems(items.filter(item => item.currentStock <= item.minStockLevel));

        let normal = 0, low = 0, critical = 0;
        items.forEach(item => {
          if (item.currentStock === 0) {
            critical++;
          } else if (item.currentStock <= item.minStockLevel) {
            low++;
          } else {
            normal++;
          }
        });
        setInventorySummary({ normal, low, critical });
      });

      // Pobieranie listy zakupów (publicznej kolekcji dla współpracy)
      const shoppingListRef = collection(db, `artifacts/${__app_id}/public/data/shoppingList`);
      const unsubscribeShoppingList = onSnapshot(query(shoppingListRef, where('purchased', '==', false)), (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPendingOrders(items);
      });

      // Pobieranie historii zmian
      const historyRef = collection(db, `artifacts/${__app_id}/users/${userId}/history`);
      const unsubscribeHistory = onSnapshot(historyRef, (snapshot) => {
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sortowanie w pamięci, jeśli nie ma indeksów Firestore
        events.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
        setHistoryEvents(events);
      });

      return () => {
        unsubscribeInventory();
        unsubscribeShoppingList();
        unsubscribeHistory();
      };
    }
    */

    // --- Twój obecny kod (dane statyczne i localStorage) ---
    setLowStockItems([
      { id: 1, name: 'Masa wyciskowa', stock: 2, minStock: 5, category: 'Materiały', price: 50, minStockLevel: 5, currentStock: 2 },
      { id: 2, name: 'Narzędzia protetyczne', stock: 1, minStock: 5, category: 'Sprzęt', price: 200, minStockLevel: 5, currentStock: 1 },
      { id: 3, name: 'Nożyczki chirurgiczne', stock: 1, minStock: 3, category: 'Sprzęt', price: 75, minStockLevel: 3, currentStock: 1 },
      // Dodaj więcej przykładowych danych, aby lepiej testować filtrowanie i sortowanie
      { id: 4, name: 'Rękawiczki nitrylowe', stock: 10, minStock: 20, category: 'Materiały jednorazowe', price: 10, minStockLevel: 20, currentStock: 10 },
      { id: 5, name: 'Wiertła diamentowe', stock: 3, minStock: 5, category: 'Narzędzia', price: 150, minStockLevel: 5, currentStock: 3 },
      { id: 6, name: 'Płyn do dezynfekcji', stock: 1, minStock: 5, category: 'Chemia', price: 30, minStockLevel: 5, currentStock: 1 },
      { id: 7, name: 'Igły dentystyczne', stock: 0, minStock: 10, category: 'Materiały jednorazowe', price: 5, minStockLevel: 10, currentStock: 0 }, // Przykład krytycznego stanu
      { id: 8, name: 'Wypełnienie kompozytowe', stock: 8, minStock: 10, category: 'Materiały', price: 120, minStockLevel: 10, currentStock: 8 },
      { id: 9, name: 'Środek znieczulający', stock: 5, minStock: 15, category: 'Farmaceutyki', price: 80, minStockLevel: 15, currentStock: 5 },
      { id: 10, name: 'Folie do RTG', stock: 15, minStock: 20, category: 'Diagnostyka', price: 40, minStockLevel: 20, currentStock: 15 },
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

    // Obliczanie inventorySummary na podstawie lowStockItems
    const allItems = [
      { id: 1, name: 'Masa wyciskowa', stock: 2, minStock: 5, category: 'Materiały', price: 50, minStockLevel: 5, currentStock: 2 },
      { id: 2, name: 'Narzędzia protetyczne', stock: 1, minStock: 5, category: 'Sprzęt', price: 200, minStockLevel: 5, currentStock: 1 },
      { id: 3, name: 'Nożyczki chirurgiczne', stock: 1, minStock: 3, category: 'Sprzęt', price: 75, minStockLevel: 3, currentStock: 1 },
      { id: 4, name: 'Rękawiczki nitrylowe', stock: 10, minStock: 20, category: 'Materiały jednorazowe', price: 10, minStockLevel: 20, currentStock: 10 },
      { id: 5, name: 'Wiertła diamentowe', stock: 3, minStock: 5, category: 'Narzędzia', price: 150, minStockLevel: 5, currentStock: 3 },
      { id: 6, name: 'Płyn do dezynfekcji', stock: 1, minStock: 5, category: 'Chemia', price: 30, minStockLevel: 5, currentStock: 1 },
      { id: 7, name: 'Igły dentystyczne', stock: 0, minStock: 10, category: 'Materiały jednorazowe', price: 5, minStockLevel: 10, currentStock: 0 },
      { id: 8, name: 'Wypełnienie kompozytowe', stock: 8, minStock: 10, category: 'Materiały', price: 120, minStockLevel: 10, currentStock: 8 },
      { id: 9, name: 'Środek znieczulający', stock: 5, minStock: 15, category: 'Farmaceutyki', price: 80, minStockLevel: 15, currentStock: 5 },
      { id: 10, name: 'Folie do RTG', stock: 15, minStock: 20, category: 'Diagnostyka', price: 40, minStockLevel: 20, currentStock: 15 },
      // Dodaj więcej elementów, które są w "dobrym stanie"
      { id: 11, name: 'Szpatułki', stock: 50, minStock: 10, category: 'Narzędzia', price: 5 },
      { id: 12, name: 'Waciki', stock: 100, minStock: 30, category: 'Materiały jednorazowe', price: 2 },
    ];

    let normalCount = 0;
    let lowCount = 0;
    let criticalCount = 0;

    allItems.forEach(item => {
      if (item.stock === 0) {
        criticalCount++;
      } else if (item.stock <= item.minStock) {
        lowCount++;
      } else {
        normalCount++;
      }
    });

    setInventorySummary({
      normal: normalCount,
      low: lowCount,
      critical: criticalCount
    });

  }, []); // Pamiętaj, aby dodać zależności, jeśli używasz stanów w useEffect

  // Funkcja do aktualizacji todayEvents po dodaniu/edycji wydarzenia w EventCalendar
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

  // --- PROPOZYCJA ZMIANY: Funkcja addToShoppingList powinna zapisywać do Firestore ---
  // Powinna też logować tę akcję do kolekcji historii.
  const addToShoppingList = (item) => {
    // Jeśli używasz Firebase:
    /*
    if (!db || !userId) {
      // Pokaż modal błędu, że użytkownik nie jest zalogowany
      return;
    }
    const shoppingListCollectionRef = collection(db, `artifacts/${__app_id}/public/data/shoppingList`);
    const stockDifference = item.minStock - item.stock;
    const quantityToAdd = stockDifference > 0 ? stockDifference : 1;

    // Sprawdź, czy produkt już istnieje na liście zakupów, aby zaktualizować ilość, a nie dodawać duplikat
    const existingQuery = query(shoppingListCollectionRef, where('productId', '==', item.id), where('purchased', '==', false));
    getDocs(existingQuery).then(snapshot => {
      if (!snapshot.empty) {
        const existingDoc = snapshot.docs[0];
        updateDoc(existingDoc.ref, {
          quantity: existingDoc.data().quantity + quantityToAdd,
          timestamp: new Date(),
          addedBy: userId, // Aktualizuj, kto ostatnio zmodyfikował
          addedByName: username // Możesz użyć username z propsów
        });
      } else {
        addDoc(shoppingListCollectionRef, {
          productId: item.id,
          productName: item.name,
          category: item.category,
          quantity: quantityToAdd,
          addedBy: userId,
          addedByName: username, // Zapisz, kto dodał
          timestamp: new Date(),
          purchased: false,
        });
      }
      // Logowanie do historii zmian
      const historyCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/history`);
      addDoc(historyCollectionRef, {
        action: 'added_to_shopping_list',
        details: { itemName: item.name, quantity: quantityToAdd },
        timestamp: new Date(),
        userId: userId,
      });
    }).catch(error => console.error("Błąd dodawania do listy zakupów:", error));
    */

    // --- Twój obecny kod (localStorage) ---
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
        price: item.price || 0,
        // PROPOZYCJA: Dodaj pole 'addedBy' tutaj, ale będzie ono lokalne dla localStorage
        // addedBy: username,
      };
      currentShoppingList.push(newItem);
    }
    localStorage.setItem('products', JSON.stringify(currentShoppingList));
  };

  // --- PROPOZYCJA ZMIANY: Dane wykresów powinny być dynamiczne ---
  // Powinny odzwierciedlać prawdziwe dane z Firebase, a nie statyczne.
  const orderChartData = {
    labels: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec'],
    datasets: [
      {
        label: 'Liczba zamówień',
        data: [12, 19, 3, 5, 2, 3], // Te dane powinny pochodzić z historii zamówień
        backgroundColor: '#3498DB',
        borderColor: '#2C3E50',
        borderWidth: 1,
      },
      {
        label: 'Oszczędności (w PLN)',
        data: [500, 800, 1200, 900, 1500, 2000], // Te dane powinny pochodzić z raportów oszczędności
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

  // --- PROPOZYCJA ZMIANY: Filtrowanie i sortowanie dla lowStockItems ---
  // Zastosuj filtrowanie i sortowanie do lowStockItems przed renderowaniem.
  const filteredAndSortedLowStockItems = lowStockItems
    .filter(item =>
      item.name.toLowerCase().includes(inventoryFilter.toLowerCase()) ||
      item.category.toLowerCase().includes(inventoryFilter.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (inventorySortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (inventorySortBy === 'stock') {
        comparison = a.stock - b.stock;
      } else if (inventorySortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      return inventorySortOrder === 'asc' ? comparison : -comparison;
    });

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
            {/* PROPOZYCJA: Dodaj statystykę "W realizacji" pobieraną z Firestore */}
            {/* <div className="tile-stat">
              <span className="tile-label">W realizacji:</span>
              <span className="tile-value info">X</span>
            </div> */}
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
              <span className="tile-value info">3</span> {/* PROPOZYCJA: To też powinno być dynamiczne */}
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
              <span className="tile-value success">2000 zł</span> {/* PROPOZYCJA: To też powinno być dynamiczne */}
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
            {/* PROPOZYCJA: EventCalendar powinien być zintegrowany z Firebase, aby wydarzenia były współdzielone i trwałe */}
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

            {/* PROPOZYCJA: Dodaj pola do filtrowania i sortowania */}
            <div className="filter-sort-controls">
              <input
                type="text"
                placeholder="Filtruj produkty..."
                value={inventoryFilter}
                onChange={(e) => setInventoryFilter(e.target.value)}
                className="filter-input"
              />
              <select
                value={inventorySortBy}
                onChange={(e) => setInventorySortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Sortuj po nazwie</option>
                <option value="stock">Sortuj po stanie</option>
                <option value="category">Sortuj po kategorii</option>
              </select>
              <button
                onClick={() => setInventorySortOrder(inventorySortOrder === 'asc' ? 'desc' : 'asc')}
                className="sort-order-button"
              >
                {inventorySortOrder === 'asc' ? 'Rosnąco' : 'Malejąco'}
              </button>
            </div>

            {filteredAndSortedLowStockItems.length > 0 ? (
              <div className="low-stock-table-container">
                <div className="low-stock-actions">
                  <button
                    className="add-all-to-list-button"
                    onClick={() => filteredAndSortedLowStockItems.forEach(item => addToShoppingList(item))}
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
                    {filteredAndSortedLowStockItems.map(item => {
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
                            {/* PROPOZYCJA: Dodaj przyciski do edycji i usuwania produktu */}
                            {/* <button className="small-button edit-button">Edytuj</button> */}
                            {/* <button className="small-button delete-button">Usuń</button> */}
                            {/* PROPOZYCJA: Integracja z AI - sugestie zakupowe / opis produktu */}
                            {/* <button className="small-button ai-button">Sugestie AI</button> */}
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
                          {/* PROPOZYCJA: Dodaj przycisk "Oznacz jako zrealizowane" */}
                          {/* <button className="small-button complete-order-button">Zrealizowano</button> */}
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
      case 'reports':
        return (
          <div className="tab-content">
            <h3 className="section-title">Raporty i Analizy</h3>
            {/* PROPOZYCJA: Rozbuduj tę sekcję o faktyczne raporty oszczędności i historii zmian */}
            <div className="report-section">
              <h4>Raport Oszczędności</h4>
              <p>Tutaj znajdzie się interaktywny raport oszczędności, np. dzięki zakupom hurtowym lub optymalizacji zapasów. Można by tu wizualizować dane z historii zakupów i porównywać ceny.</p>
              {/* PROPOZYCJA: Wykresy i tabele z danymi o oszczędnościach */}
            </div>
            <div className="report-section">
              <h4>Historia Zmian</h4>
              {/* PROPOZYCJA: Wyświetl listę historyEvents z Firebase */}
              {historyEvents.length > 0 ? (
                <div className="history-list">
                  {historyEvents.map(event => (
                    <div key={event.id} className="history-item">
                      <p>{event.action}: {event.details.itemName} ({new Date(event.timestamp.toDate()).toLocaleString()})</p>
                      <p className="history-user">Przez: {event.userId}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">Brak zarejestrowanych zmian.</p>
              )}
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
          <FaEye /> {/* Ikona dla Przeglądu */}
          <span>Przegląd</span>
        </button>
        <button className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          <FaBox /> {/* Ikona dla Magazynu */}
          <span>Magazyn</span>
        </button>
        <button className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          <FaShoppingCart /> {/* Ikona dla Zamówień */}
          <span>Zamówienia</span>
        </button>
        <button className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          <FaChartBar /> {/* Ikona dla Raportów */}
          <span>Raporty</span>
        </button>
        <button className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <FaCalendarAlt /> {/* Ikona dla Kalendarza */}
          <span>Kalendarz</span>
        </button>
      </div>
      {renderTabContent()}
    </div>
  );
}

export default Dashboard;
