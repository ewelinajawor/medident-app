import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaFileAlt, FaSpinner, FaCheck, FaExclamationTriangle, FaCalendarAlt, FaFilter, FaShoppingCart, FaEdit, FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaTrash, FaPrint } from 'react-icons/fa';
import './Orders.css';

function Orders() {
  const [activeTab, setActiveTab] = useState('orderHistory');
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: '',
    status: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Symulacja ładowania danych z API
  useEffect(() => {
    // Symulacja opóźnienia ładowania danych
    const fetchData = () => {
      setLoading(true);
      setTimeout(() => {
        // Przykładowe dane historyczne
        const sampleOrders = [
          { 
            id: 1, 
            date: '2025-03-18', 
            items: [
              { name: 'Masa wyciskowa', quantity: 3, price: 45.20 },
              { name: 'Rękawiczki lateksowe', quantity: 10, price: 8.50 }
            ],
            status: 'W realizacji', 
            amount: 153.10,
            supplier: 'Koldental',
            trackingNumber: 'KD2025031801' 
          },
          { 
            id: 2, 
            date: '2025-03-15', 
            items: [
              { name: 'Narzędzia protetyczne', quantity: 2, price: 125.00 },
              { name: 'Środek do dezynfekcji', quantity: 5, price: 22.80 }
            ],
            status: 'Wysłane', 
            amount: 364.00,
            supplier: 'Meditrans',
            trackingNumber: 'MT2025031502' 
          },
          { 
            id: 3, 
            date: '2025-03-10', 
            items: [
              { name: 'Cement stomatologiczny', quantity: 4, price: 65.30 },
              { name: 'Strzykawki', quantity: 20, price: 3.40 }
            ],
            status: 'Dostarczone', 
            amount: 329.20,
            supplier: 'Koldental',
            trackingNumber: 'KD2025031003' 
          },
          { 
            id: 4, 
            date: '2025-03-05', 
            items: [
              { name: 'Wałeczki stomatologiczne', quantity: 8, price: 12.60 },
              { name: 'Końcówki do ssaków', quantity: 15, price: 5.20 }
            ],
            status: 'Dostarczone', 
            amount: 178.80,
            supplier: 'Marrodent',
            trackingNumber: 'MD2025030504' 
          },
          { 
            id: 5, 
            date: '2025-02-28', 
            items: [
              { name: 'Nożyczki chirurgiczne', quantity: 1, price: 189.00 },
              { name: 'Materiały do wypełnień', quantity: 5, price: 42.30 }
            ],
            status: 'Dostarczone', 
            amount: 400.50,
            supplier: 'Meditrans',
            trackingNumber: 'MT2025022805' 
          }
        ];
        
        setOrderHistory(sampleOrders);
        setLoading(false);
      }, 800);
    };
    
    fetchData();
  }, []);

  // Funkcja do zmiany aktywnej zakładki
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedOrders([]);
    setSelectAll(false);
  };

  // Funkcja do filtrowania historii zamówień
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Resetuj stronę przy zmianie filtrów
  };
  
  // Funkcja do wyczyszczenia filtrów
  const clearFilters = () => {
    setFilters({
      date: '',
      status: 'all',
      search: ''
    });
    setCurrentPage(1);
  };

  // Funkcja do zaznaczania/odznaczania zamówienia
  const toggleOrderSelection = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  // Funkcja do zaznaczania/odznaczania wszystkich zamówień na stronie
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
    } else {
      const currentOrderIds = currentOrders.map(order => order.id);
      setSelectedOrders(currentOrderIds);
    }
    setSelectAll(!selectAll);
  };

  // Filtrowanie zamówień
  const filteredOrders = orderHistory.filter(order => {
    // Filtrowanie po dacie
    const dateMatch = filters.date 
      ? new Date(order.date).toISOString().slice(0, 10) === filters.date 
      : true;
    
    // Filtrowanie po statusie
    const statusMatch = filters.status === 'all' 
      ? true 
      : order.status === filters.status;
    
    // Filtrowanie po wyszukiwaniu (sprawdź dostawcę i produkty)
    const searchTerm = filters.search.toLowerCase();
    const searchMatch = !searchTerm
      ? true
      : order.supplier.toLowerCase().includes(searchTerm) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm));
    
    return dateMatch && statusMatch && searchMatch;
  });

  // Paginacja
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  
  // Zmiana strony
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectAll(false);
  };

  // Formatowanie daty
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pl-PL', options);
  };
  
  // Renderowanie ikon statusu
  const renderStatusIcon = (status) => {
    switch(status) {
      case 'W realizacji':
        return <FaSpinner className="status-icon spinning" />;
      case 'Wysłane':
        return <FaExclamationTriangle className="status-icon sent" />;
      case 'Dostarczone':
        return <FaCheck className="status-icon delivered" />;
      default:
        return null;
    }
  };
  
  // Obsługa akcji dla wybranych zamówień
  const handleBulkAction = (action) => {
    if (selectedOrders.length === 0) {
      alert('Wybierz co najmniej jedno zamówienie');
      return;
    }
    
    switch (action) {
      case 'print':
        alert(`Drukowanie ${selectedOrders.length} zamówień`);
        break;
      case 'delete':
        if (window.confirm(`Czy na pewno chcesz usunąć ${selectedOrders.length} wybranych zamówień?`)) {
          setOrderHistory(orderHistory.filter(order => !selectedOrders.includes(order.id)));
          setSelectedOrders([]);
          setSelectAll(false);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="orders-container">
      <h2>Zamówienia</h2>

      {/* Przyciski nawigacyjne */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'orderHistory' ? 'active' : ''}`}
          onClick={() => handleTabChange('orderHistory')}
        >
          <FaFileAlt /> Historia zamówień
        </button>
        <Link to="/shopping-list" className="tab-button">
          <FaShoppingCart /> Lista zakupów
        </Link>
        <button
          className={`tab-button ${activeTab === 'modifyOrder' ? 'active' : ''}`}
          onClick={() => handleTabChange('modifyOrder')}
        >
          <FaEdit /> Modyfikuj zamówienie
        </button>
      </div>

      {/* Zawartość w zależności od aktywnej zakładki */}
      {activeTab === 'orderHistory' && (
        <div className="order-history">
          <div className="filters-section">
            <h3>Historia zamówień</h3>
            
            {/* Filtry */}
            <div className="filters">
              <div className="filter-group">
                <label><FaCalendarAlt /> Data zamówienia:</label>
                <input
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div className="filter-group">
                <label><FaFilter /> Status:</label>
                <select 
                  name="status" 
                  value={filters.status} 
                  onChange={handleFilterChange}
                >
                  <option value="all">Wszystkie</option>
                  <option value="W realizacji">W realizacji</option>
                  <option value="Wysłane">Wysłane</option>
                  <option value="Dostarczone">Dostarczone</option>
                </select>
              </div>
              
              <div className="filter-group search-group">
                <label><FaSearch /> Szukaj:</label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Produkt lub dostawca..."
                />
              </div>
              
              <button 
                className="clear-filters-btn"
                onClick={clearFilters}
              >
                Wyczyść filtry
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Ładowanie zamówień...</p>
            </div>
          ) : (
            <>
              {filteredOrders.length === 0 ? (
                <div className="no-orders">
                  <FaExclamationTriangle />
                  <p>Brak zamówień spełniających kryteria wyszukiwania</p>
                </div>
              ) : (
                <>
                  <div className="orders-summary">
                    <p>Znaleziono <strong>{filteredOrders.length}</strong> zamówień</p>
                    
                    {/* Akcje zbiorcze */}
                    {selectedOrders.length > 0 && (
                      <div className="bulk-actions">
                        <span>{selectedOrders.length} wybranych</span>
                        <button onClick={() => handleBulkAction('print')} className="bulk-action-btn">
                          <FaPrint /> Drukuj
                        </button>
                        <button onClick={() => handleBulkAction('delete')} className="bulk-action-btn danger">
                          <FaTrash /> Usuń
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="order-table-container">
                    <table className="order-table">
                      <thead>
                        <tr>
                          <th className="checkbox-column">
                            <label className="checkbox-container">
                              <input 
                                type="checkbox" 
                                checked={selectAll}
                                onChange={toggleSelectAll}
                              />
                              <span className="checkmark"></span>
                            </label>
                          </th>
                          <th>Data</th>
                          <th>Dostawca</th>
                          <th>Status</th>
                          <th>Zamówienie</th>
                          <th>Wartość</th>
                          <th>Akcje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentOrders.map((order) => (
                          <tr 
                            key={order.id} 
                            className={selectedOrders.includes(order.id) ? 'selected-row' : ''}
                            onClick={() => toggleOrderSelection(order.id)}
                          >
                            <td className="checkbox-column" onClick={(e) => e.stopPropagation()}>
                              <label className="checkbox-container">
                                <input 
                                  type="checkbox" 
                                  checked={selectedOrders.includes(order.id)}
                                  onChange={() => toggleOrderSelection(order.id)}
                                />
                                <span className="checkmark"></span>
                              </label>
                            </td>
                            <td>{formatDate(order.date)}</td>
                            <td>{order.supplier}</td>
                            <td>
                              <span className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                {renderStatusIcon(order.status)}
                                {order.status}
                              </span>
                            </td>
                            <td>
                              {order.items.length} {order.items.length === 1 ? 'produkt' : 'produkty'}
                              <div className="items-preview">
                                {order.items.slice(0, 2).map((item, i) => (
                                  <span key={i} className="item-preview">
                                    {item.name} ({item.quantity} szt.)
                                  </span>
                                ))}
                                {order.items.length > 2 && (
                                  <span className="more-items">+{order.items.length - 2} więcej</span>
                                )}
                              </div>
                            </td>
                            <td className="amount-column">{order.amount.toFixed(2)} zł</td>
                            <td className="actions-column" onClick={(e) => e.stopPropagation()}>
                              <button className="table-action-btn details-btn">
                                Szczegóły
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Paginacja */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button 
                        onClick={() => paginate(1)} 
                        disabled={currentPage === 1}
                        className="pagination-btn"
                      >
                        <FaAngleDoubleLeft />
                      </button>
                      <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="pagination-btn"
                      >
                        <FaAngleLeft />
                      </button>
                      
                      <span className="page-info">
                        Strona {currentPage} z {totalPages}
                      </span>
                      
                      <button 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                      >
                        <FaAngleRight />
                      </button>
                      <button 
                        onClick={() => paginate(totalPages)} 
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                      >
                        <FaAngleDoubleRight />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'modifyOrder' && (
        <div className="modify-order">
          <h3>Modyfikacja zamówienia</h3>
          <p>Wybierz zamówienie do modyfikacji z listy aktywnych zamówień:</p>
          
          <div className="active-orders">
            {orderHistory
              .filter(order => order.status !== 'Dostarczone')
              .map(order => (
                <div className="active-order-item" key={order.id}>
                  <div className="order-info">
                    <span className="order-date">{formatDate(order.date)}</span>
                    <span className="order-supplier">{order.supplier}</span>
                    <span className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {renderStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </div>
                  <div className="order-summary">
                    <span>{order.items.length} produktów</span>
                    <span>{order.amount.toFixed(2)} zł</span>
                  </div>
                  <button className="modify-btn">
                    <FaEdit /> Modyfikuj
                  </button>
                </div>
              ))}
            
            {orderHistory.filter(order => order.status !== 'Dostarczone').length === 0 && (
              <div className="no-active-orders">
                <p>Brak aktywnych zamówień do modyfikacji</p>
                <Link to="/shopping-list" className="action-btn">
                  <FaShoppingCart /> Utwórz nowe zamówienie
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;