import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, CalendarDays } from 'lucide-react';
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
import {
  KEYS,
  readJSON,
  getOrders,
  addToShoppingList,
  stockLevel,
  getAlertLevel,
  STOCK_LEVEL_LABELS
} from '../utils/storage';
import { formatMoney } from '../utils/format';
import { getRfqs, rfqProgress } from '../utils/rfq';
import { buildNotifications, getReadNotificationIds } from '../utils/notifications';
import NotificationList, { markRead, addNotificationItemToList } from './NotificationList';

const LEVEL_ORDER = { out: 0, low: 1, alert: 2, ok: 3 };
const LEVEL_BADGE = { out: 'badge-danger', low: 'badge-danger', alert: 'badge-warning', ok: 'badge-success' };

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);
ChartJS.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
ChartJS.defaults.color = '#5b6460';

const MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

const COLORS = {
  accent: '#1d6b64',
  accentLight: '#9cc3bd',
  success: '#2c7a4b',
  warning: '#d9a441',
  danger: '#b3261e',
  grid: '#ecebe6'
};

const getTodayEvents = (events) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return events
    .filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate < tomorrow;
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .map((event) => ({
      id: event.id,
      time: new Date(event.start).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      title: event.title,
      type: event.type,
      description: event.description
    }));
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 5 || hour >= 18) return 'Dobry wieczór';
  return 'Dzień dobry';
};

const STATUS_BADGE = {
  'W realizacji': 'badge-info',
  'Wysłane': 'badge-warning',
  'Dostarczone': 'badge-success'
};

const TABS = [
  { id: 'overview', label: 'Przegląd' },
  { id: 'inventory', label: 'Magazyn' },
  { id: 'orders', label: 'Zamówienia' },
  { id: 'reports', label: 'Raporty' },
  { id: 'calendar', label: 'Kalendarz' }
];

function Dashboard({ username }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [todayEvents, setTodayEvents] = useState(() => getTodayEvents(readJSON(KEYS.calendarEvents, [])));
  const [inventoryFilter, setInventoryFilter] = useState('');
  const [inventorySortBy, setInventorySortBy] = useState('level');
  const [inventorySortOrder, setInventorySortOrder] = useState('asc');
  const [message, setMessage] = useState('');

  // Dane z magazynu i historii zamówień (te same, które widać na ekranach Magazyn i Zamówienia).
  const [stock] = useState(() => readJSON(KEYS.inventory, []));
  const [orders] = useState(() => getOrders());
  const [openRfqs] = useState(() =>
    getRfqs()
      .filter((r) => r.status === 'open' || r.status === 'analysis')
      .sort((a, b) => b.number - a.number)
  );
  const [notifications] = useState(() => buildNotifications());
  const [readIds, setReadIds] = useState(() => getReadNotificationIds());
  const unreadNotifications = notifications.filter((n) => !readIds.includes(n.id));

  // Poziomy: brak / poniżej minimum / kończy się (poniżej progu ostrzegawczego) / w normie
  const inventorySummary = useMemo(() => {
    const counts = { out: 0, low: 0, alert: 0, ok: 0 };
    stock.forEach((item) => {
      counts[stockLevel(item)] += 1;
    });
    return counts;
  }, [stock]);

  const lowStockItems = useMemo(
    () =>
      stock
        .map((item) => {
          const alertLevel = getAlertLevel(item);
          return {
            ...item,
            stock: item.quantity,
            level: stockLevel(item),
            alertLevel,
            toOrder: Math.max(1, alertLevel - item.quantity)
          };
        })
        .filter((item) => item.level !== 'ok')
        .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.name.localeCompare(b.name, 'pl')),
    [stock]
  );

  const pendingOrders = orders.filter((o) => o.status !== 'Dostarczone');

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ year: d.getFullYear(), month: d.getMonth(), count: 0, amount: 0 });
    }
    orders.forEach((order) => {
      const d = new Date(order.date);
      const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
      if (bucket) {
        bucket.count += 1;
        bucket.amount += order.amount || 0;
      }
    });
    return buckets;
  }, [orders]);

  const thisMonthSpend = monthlyStats[monthlyStats.length - 1].amount;

  const topProducts = useMemo(() => {
    const totals = {};
    orders.forEach((order) =>
      order.items.forEach((item) => {
        totals[item.name] = (totals[item.name] || 0) + item.quantity;
      })
    );
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [orders]);

  // useCallback: bez tego EventCalendar wywoływał tę funkcję w efekcie przy każdym renderze → pętla renderowania.
  const handleEventsChanged = useCallback((events) => {
    setTodayEvents(getTodayEvents(events));
  }, []);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  // Uzupełniamy do progu ostrzegawczego – tak samo jak „lista z braków” na Liście zakupów.
  const orderItem = (item) => {
    addToShoppingList({ name: item.name, category: item.category, quantity: item.toOrder });
  };

  const handleNotificationRead = (id) => {
    markRead([id]);
    setReadIds(getReadNotificationIds());
  };

  const handleNotificationAddToList = (notification) => {
    const quantity = addNotificationItemToList(notification);
    handleNotificationRead(notification.id);
    showMessage(`Dodano „${notification.item.name}” (${quantity} ${notification.item.unit || 'szt'}) do listy zakupów.`);
  };

  const handleOrderOne = (item) => {
    orderItem(item);
    showMessage(`Dodano „${item.name}” do listy zakupów.`);
  };

  const handleOrderAll = (items) => {
    items.forEach(orderItem);
    showMessage(`Dodano ${items.length} produktów do listy zakupów.`);
  };

  const orderChartData = {
    labels: monthlyStats.map((b) => MONTHS[b.month]),
    datasets: [
      {
        label: 'Liczba zamówień',
        data: monthlyStats.map((b) => b.count),
        backgroundColor: COLORS.accentLight,
        borderRadius: 3,
        yAxisID: 'y'
      },
      {
        label: 'Wartość zamówień (zł)',
        data: monthlyStats.map((b) => Math.round(b.amount * 100) / 100),
        backgroundColor: COLORS.accent,
        borderRadius: 3,
        yAxisID: 'y1'
      }
    ]
  };

  const orderChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, position: 'left', ticks: { precision: 0 }, grid: { color: COLORS.grid }, border: { display: false } },
      y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, border: { display: false } },
      x: { grid: { display: false } }
    },
    plugins: {
      legend: { position: 'bottom', align: 'start', labels: { boxWidth: 10, boxHeight: 10 } },
      title: { display: false }
    }
  };

  const inventoryChartData = {
    labels: ['W normie', 'Kończy się', 'Poniżej minimum', 'Brak'],
    datasets: [
      {
        data: [inventorySummary.ok, inventorySummary.alert, inventorySummary.low, inventorySummary.out],
        backgroundColor: [COLORS.success, COLORS.warning, '#d9773b', COLORS.danger],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  const inventoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 10, boxHeight: 10 } },
      title: { display: false }
    }
  };

  const filterText = inventoryFilter.trim().toLowerCase();
  const filteredAndSortedLowStockItems = lowStockItems
    .filter(
      (item) =>
        item.name.toLowerCase().includes(filterText) || (item.category || '').toLowerCase().includes(filterText)
    )
    .sort((a, b) => {
      let comparison = 0;
      if (inventorySortBy === 'level') comparison = LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.name.localeCompare(b.name, 'pl');
      else if (inventorySortBy === 'name') comparison = a.name.localeCompare(b.name, 'pl');
      else if (inventorySortBy === 'stock') comparison = a.stock - b.stock;
      else if (inventorySortBy === 'category') comparison = (a.category || '').localeCompare(b.category || '', 'pl');
      return inventorySortOrder === 'asc' ? comparison : -comparison;
    });

  const belowMinimum = inventorySummary.low + inventorySummary.out;
  const stats = [
    { label: 'Poniżej minimum', value: belowMinimum, tone: belowMinimum > 0 ? 'danger' : '', to: '/inventory' },
    { label: 'Kończy się', value: inventorySummary.alert, tone: inventorySummary.alert > 0 ? 'warning' : '', to: '/inventory' },
    { label: 'Zamówienia w toku', value: pendingOrders.length, tone: '', to: '/orders' },
    { label: 'Wydatki w tym miesiącu', value: `${formatMoney(thisMonthSpend)}`, tone: '', to: '/savings' }
  ];

  const lowStockTable = (items, compact = false) => (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Produkt</th>
            {!compact && <th className="hide-narrow">Kategoria</th>}
            <th>Status</th>
            <th className="right">Stan</th>
            <th className="right hide-narrow">Minimum</th>
            {!compact && <th className="right hide-narrow">Próg</th>}
            <th className="right hide-narrow">Do zamówienia</th>
            <th aria-label="Akcje"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              {!compact && <td className="muted hide-narrow">{item.category}</td>}
              <td><span className={`badge ${LEVEL_BADGE[item.level]}`}>{STOCK_LEVEL_LABELS[item.level]}</span></td>
              <td className="right num">{item.stock} {item.unit}</td>
              <td className="right num muted hide-narrow">{item.minStock}</td>
              {!compact && <td className="right num muted hide-narrow">{item.alertLevel}</td>}
              <td className="right num hide-narrow">{item.toOrder}</td>
              <td className="right">
                <button className="btn btn-secondary btn-sm" onClick={() => handleOrderOne(item)}>Zamów</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
          <div className="card">
            <EventCalendar onEventAdded={handleEventsChanged} />
          </div>
        );
      case 'inventory':
        return (
          <div className="dash-stack">
            {stock.length === 0 ? (
              <div className="empty-state">
                <h4>Magazyn jest pusty</h4>
                <p>Przyjmij pierwszy towar, aby zobaczyć tu stan zapasów.</p>
                <Link to="/inventory" className="btn btn-primary">Przejdź do magazynu</Link>
              </div>
            ) : (
              <div className="card dash-chart-card">
                <h3 className="section-label">Stan magazynowy</h3>
                <div className="chart-box chart-box-small">
                  <Doughnut data={inventoryChartData} options={inventoryChartOptions} />
                </div>
              </div>
            )}

            <div className="card card-flush">
              <div className="card-toolbar">
                <h3>Wymagają uzupełnienia</h3>
                <div className="toolbar-controls">
                  <input
                    type="search"
                    placeholder="Filtruj…"
                    value={inventoryFilter}
                    onChange={(e) => setInventoryFilter(e.target.value)}
                  />
                  <select value={inventorySortBy} onChange={(e) => setInventorySortBy(e.target.value)}>
                    <option value="level">Pilność</option>
                    <option value="name">Nazwa</option>
                    <option value="stock">Stan</option>
                    <option value="category">Kategoria</option>
                  </select>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setInventorySortOrder(inventorySortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {inventorySortOrder === 'asc' ? 'Rosnąco' : 'Malejąco'}
                  </button>
                  {filteredAndSortedLowStockItems.length > 0 && (
                    <button className="btn btn-primary" onClick={() => handleOrderAll(filteredAndSortedLowStockItems)}>
                      Dodaj wszystkie do listy
                    </button>
                  )}
                </div>
              </div>
              {filteredAndSortedLowStockItems.length > 0 ? (
                lowStockTable(filteredAndSortedLowStockItems)
              ) : (
                <p className="card-empty">Wszystkie produkty mają wystarczający stan.</p>
              )}
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="dash-stack">
            <div className="card dash-chart-card">
              <h3 className="section-label">Zamówienia z ostatnich 6 miesięcy</h3>
              <div className="chart-box">
                <Bar data={orderChartData} options={orderChartOptions} />
              </div>
            </div>
            <div className="card card-flush">
              <div className="card-toolbar">
                <h3>W toku</h3>
                <Link to="/orders" className="btn btn-ghost btn-sm">Wszystkie zamówienia <ArrowRight /></Link>
              </div>
              {pendingOrders.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Dostawca</th>
                        <th className="right">Pozycji</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="num">{new Date(order.date).toLocaleDateString('pl-PL')}</td>
                          <td>{order.supplier}</td>
                          <td className="right num">{order.items.length}</td>
                          <td><span className={`badge ${STATUS_BADGE[order.status] || ''}`}>{order.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="card-empty">Brak zamówień w toku.</p>
              )}
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="dash-grid">
            <div className="card">
              <h3 className="section-label">Podsumowanie</h3>
              <dl className="kv">
                <dt>Liczba zamówień</dt>
                <dd className="num">{orders.length}</dd>
                <dt>Łączna wartość</dt>
                <dd className="num">{formatMoney(orders.reduce((sum, o) => sum + (o.amount || 0), 0))}</dd>
              </dl>
            </div>
            <div className="card">
              <h3 className="section-label">Najczęściej zamawiane</h3>
              {topProducts.length > 0 ? (
                <ol className="ranked-list">
                  {topProducts.map(([name, qty]) => (
                    <li key={name}>
                      <span>{name}</span>
                      <span className="num muted">{qty} szt.</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="muted">Brak danych – złóż pierwsze zamówienie z listy zakupów.</p>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="dash-stack">
          <div className="dash-grid">
            <div className="dash-stack">
            <div className="card">
              <div className="card-head">
                <h3>Dzisiaj</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('calendar')}>
                  <CalendarDays /> Kalendarz
                </button>
              </div>
              {todayEvents.length > 0 ? (
                <ul className="event-list">
                  {todayEvents.map((event) => (
                    <li key={event.id} className={`event-row event-${event.type}`}>
                      <span className="event-time num">{event.time}</span>
                      <span>
                        <span className="event-title">{event.title}</span>
                        {event.description && <span className="event-description">{event.description}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nic zaplanowanego na dziś.</p>
              )}
            </div>

            {openRfqs.length > 0 && (
              <div className="card card-flush">
                <div className="card-toolbar">
                  <h3>Zapytania ofertowe</h3>
                  <Link to="/offers" className="btn btn-ghost btn-sm">Wszystkie <ArrowRight /></Link>
                </div>
                <ul className="rfq-list">
                  {openRfqs.map((rfq) => {
                    const progress = rfqProgress(rfq);
                    return (
                      <li key={rfq.id}>
                        <Link to={`/offers?rfq=${rfq.id}`} className="rfq-row">
                          <span className="rfq-main">
                            <span className="rfq-title">Zapytanie nr {rfq.number}</span>
                            <span className="rfq-progress muted">
                              Otrzymano {progress.received} z {progress.total} ofert
                            </span>
                          </span>
                          {progress.overdue.length > 0 ? (
                            <span className="badge badge-danger">Po terminie</span>
                          ) : progress.complete ? (
                            <span className="badge badge-success">Do analizy</span>
                          ) : (
                            <span className="badge badge-info">
                              {progress.daysLeft <= 0 ? 'Termin dziś' : `Termin za ${progress.daysLeft} dn.`}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            </div>

            <div className="card card-flush">
              <div className="card-toolbar">
                <h3>Wymagają uzupełnienia</h3>
                {lowStockItems.length > 5 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('inventory')}>
                    Wszystkie ({lowStockItems.length}) <ArrowRight />
                  </button>
                )}
              </div>
              {lowStockItems.length > 0 ? (
                lowStockTable(lowStockItems.slice(0, 5), true)
              ) : (
                <p className="card-empty">
                  {stock.length === 0 ? 'Magazyn jest jeszcze pusty.' : 'Wszystkie produkty mają wystarczający stan.'}
                </p>
              )}
            </div>
          </div>

          <div className="card card-flush dash-notifications">
            <div className="card-toolbar">
              <h3>
                Powiadomienia
                {unreadNotifications.length > 0 && (
                  <span className="muted dash-count"> · {unreadNotifications.length} nieprzeczytane</span>
                )}
              </h3>
              <Link to="/notifications" className="btn btn-ghost btn-sm">Wszystkie <ArrowRight /></Link>
            </div>
            {unreadNotifications.length > 0 ? (
              <NotificationList
                compact
                notifications={unreadNotifications.slice(0, 5)}
                readIds={readIds}
                onRead={handleNotificationRead}
                onAddToList={handleNotificationAddToList}
              />
            ) : (
              <p className="card-empty">Brak nowych powiadomień.</p>
            )}
          </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard page">
      <header className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {username || 'witaj'}</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link to="/shopping-list" className="btn btn-primary"><Plus /> Nowe zamówienie</Link>
      </header>

      {message && <div className="notice" role="status">{message}</div>}

      <div className="stat-row">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className={`stat ${stat.tone}`}>
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value num">{stat.value}</span>
          </Link>
        ))}
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
}

export default Dashboard;
