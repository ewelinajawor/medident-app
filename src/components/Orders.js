import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Printer,
  Trash2,
  PackageCheck,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { getOrders, saveOrders, receiveOrderIntoInventory, ORDER_STATUSES } from '../utils/storage';
import './Orders.css';
import { formatMoney } from '../utils/format';

const ORDERS_PER_PAGE = 5;

const STATUS_BADGE = {
  'W realizacji': 'badge-info',
  'Wysłane': 'badge-warning',
  'Dostarczone': 'badge-success'
};

const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatAmount = (value) => (value > 0 ? `${formatMoney(value)}` : '—');

const pluralProducts = (n) => {
  if (n === 1) return 'produkt';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  return lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'produkty' : 'produktów';
};

const pluralOrders = (n) => {
  if (n === 1) return 'zamówienie';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  return lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'zamówienia' : 'zamówień';
};

function Orders() {
  const [orders, setOrders] = useState(() => getOrders());
  const [filters, setFilters] = useState({ date: '', status: 'all', search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateOrders = (updater) => {
    setOrders((prev) => {
      const next = updater(prev);
      saveOrders(next);
      return next;
    });
  };

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ date: '', status: 'all', search: '' });
    setCurrentPage(1);
  };

  const hasFilters = filters.date || filters.status !== 'all' || filters.search;

  const filteredOrders = orders
    .filter((order) => {
      const dateMatch = filters.date ? toDateKey(order.date) === filters.date : true;
      const statusMatch = filters.status === 'all' || order.status === filters.status;
      const term = filters.search.trim().toLowerCase();
      const searchMatch =
        !term ||
        order.supplier.toLowerCase().includes(term) ||
        order.items.some((item) => (item.name || '').toLowerCase().includes(term));
      return dateMatch && statusMatch && searchMatch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const currentOrders = filteredOrders.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);
  const allOnPageSelected = currentOrders.length > 0 && currentOrders.every((o) => selectedOrders.includes(o.id));

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    const ids = currentOrders.map((o) => o.id);
    setSelectedOrders((prev) =>
      allOnPageSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]
    );
  };

  const changeStatus = (orderId, status) => {
    updateOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const receiveIntoStock = (order) => {
    receiveOrderIntoInventory(order);
    updateOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: 'Dostarczone', receivedToStock: true } : o))
    );
    showMessage(`Przyjęto na magazyn ${order.items.length} ${pluralProducts(order.items.length)} od ${order.supplier}.`);
  };

  const deleteSelected = () => {
    updateOrders((prev) => prev.filter((o) => !selectedOrders.includes(o.id)));
    showMessage(`Usunięto ${selectedOrders.length} ${pluralOrders(selectedOrders.length)}.`);
    setSelectedOrders([]);
    setConfirmDelete(false);
  };

  return (
    <div className="orders-page page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Zamówienia</h1>
          <p className="page-subtitle">Historia zamówień, statusy i przyjęcie dostaw na magazyn</p>
        </div>
        <Link to="/shopping-list" className="btn btn-primary">
          <Plus /> Nowe zamówienie
        </Link>
      </header>

      {message && <div className="notice" role="status">{message}</div>}

      <div className="toolbar">
        <div className="search-field">
          <Search className="search-field-icon" aria-hidden="true" />
          <input
            type="search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Szukaj produktu lub dostawcy"
            aria-label="Szukaj"
          />
        </div>
        <select name="status" value={filters.status} onChange={handleFilterChange} aria-label="Status">
          <option value="all">Wszystkie statusy</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="date"
          name="date"
          value={filters.date}
          onChange={handleFilterChange}
          aria-label="Data zamówienia"
        />
        {hasFilters && (
          <button className="btn btn-ghost" onClick={clearFilters}>
            Wyczyść filtry
          </button>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <h4>Nie ma jeszcze zamówień</h4>
          <p>Zamówienia złożone z listy zakupów lub porównania ofert pojawią się tutaj.</p>
          <Link to="/shopping-list" className="btn btn-primary">
            Utwórz zamówienie z listy zakupów
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <h4>Brak wyników</h4>
          <p>Żadne zamówienie nie pasuje do wybranych filtrów.</p>
        </div>
      ) : (
        <>
          <div className="list-bar">
            <span className="muted">
              <strong className="num">{filteredOrders.length}</strong> {pluralOrders(filteredOrders.length)}
            </span>

            {selectedOrders.length > 0 && (
              <div className="bulk-actions">
                <span className="muted">Zaznaczono: {selectedOrders.length}</span>
                <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
                  <Printer /> Drukuj
                </button>
                {confirmDelete ? (
                  <>
                    <button onClick={deleteSelected} className="btn btn-danger btn-sm">
                      Potwierdź usunięcie
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm">
                      Anuluj
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="btn btn-danger btn-sm">
                    <Trash2 /> Usuń
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="card card-flush">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="col-check">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleSelectAll}
                        aria-label="Zaznacz wszystkie na stronie"
                      />
                    </th>
                    <th>Data</th>
                    <th>Dostawca</th>
                    <th>Status</th>
                    <th className="hide-sm">Pozycje</th>
                    <th className="right">Wartość</th>
                    <th aria-label="Akcje"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((order) => {
                    const isExpanded = expandedOrder === order.id;
                    const isSelected = selectedOrders.includes(order.id);
                    return (
                      <React.Fragment key={order.id}>
                        <tr className={`${isSelected ? 'is-selected' : ''} ${isExpanded ? 'is-expanded' : ''}`}>
                          <td className="col-check">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOrderSelection(order.id)}
                              aria-label="Zaznacz zamówienie"
                            />
                          </td>
                          <td className="num nowrap">{formatDate(order.date)}</td>
                          <td>{order.supplier}</td>
                          <td>
                            <span className={`badge ${STATUS_BADGE[order.status] || ''}`}>{order.status}</span>
                          </td>
                          <td className="hide-sm">
                            <span className="items-count">
                              {order.items.length} {pluralProducts(order.items.length)}
                            </span>
                            <span className="items-preview">
                              {order.items.slice(0, 2).map((item) => `${item.name} (${item.quantity})`).join(', ')}
                              {order.items.length > 2 && ` i ${order.items.length - 2} więcej`}
                            </span>
                          </td>
                          <td className="right num nowrap">{formatAmount(order.amount)}</td>
                          <td className="right">
                            <button
                              className="btn btn-ghost btn-sm details-toggle"
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? 'Zwiń szczegóły' : 'Pokaż szczegóły'}
                            >
                              <span className="label-wide">{isExpanded ? 'Zwiń' : 'Szczegóły'}</span>
                              {isExpanded ? <ChevronUp /> : <ChevronDown />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="details-row">
                            <td colSpan={7}>
                              <div className="order-details">
                                <table className="details-table">
                                  <thead>
                                    <tr>
                                      <th>Produkt</th>
                                      <th className="right">Ilość</th>
                                      <th className="right">Wartość</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items.map((item, i) => (
                                      <tr key={i}>
                                        <td>
                                          {item.name}
                                          {item.gratis && (
                                            <span className="badge badge-accent gratis-badge">
                                              Gratis: {[item.gratis.qty > 0 ? `${item.gratis.qty} szt.` : null, item.gratis.desc || null].filter(Boolean).join(' – ') || 'tak'}
                                              {item.gratis.value > 0 && ` (${formatMoney(item.gratis.value)})`}
                                            </span>
                                          )}
                                        </td>
                                        <td className="right num">{item.quantity} szt.</td>
                                        <td className="right num">
                                          {item.price > 0 ? `${formatMoney((item.price * item.quantity))}` : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                                {order.notes && (
                                  <p className="order-notes">
                                    <span className="muted">Uwagi:</span> {order.notes}
                                    {/^Z zapytania ofertowego nr \d+/.test(order.notes) && (
                                      <> · <Link to="/offers">Zobacz zapytania ofertowe</Link></>
                                    )}
                                  </p>
                                )}

                                <div className="details-actions">
                                  <label className="status-field">
                                    <span className="muted">Status</span>
                                    <select
                                      value={order.status}
                                      onChange={(e) => changeStatus(order.id, e.target.value)}
                                    >
                                      {ORDER_STATUSES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                  </label>
                                  {order.receivedToStock ? (
                                    <span className="received-label"><Check /> Przyjęto na magazyn</span>
                                  ) : (
                                    <button className="btn btn-primary btn-sm" onClick={() => receiveIntoStock(order)}>
                                      <PackageCheck /> Dostawa dotarła – przyjmij na magazyn
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Strony">
              <button onClick={() => setCurrentPage(1)} disabled={page === 1} className="page-btn" aria-label="Pierwsza strona">
                <ChevronsLeft />
              </button>
              <button onClick={() => setCurrentPage(page - 1)} disabled={page === 1} className="page-btn" aria-label="Poprzednia strona">
                <ChevronLeft />
              </button>
              <span className="page-info muted num">Strona {page} z {totalPages}</span>
              <button onClick={() => setCurrentPage(page + 1)} disabled={page === totalPages} className="page-btn" aria-label="Następna strona">
                <ChevronRight />
              </button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={page === totalPages} className="page-btn" aria-label="Ostatnia strona">
                <ChevronsRight />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default Orders;
