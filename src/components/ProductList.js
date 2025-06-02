import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  Building2, 
  Tag, 
  ArrowUpDown,
  X,
  SlidersHorizontal,
  Eye,
  ShoppingCart
} from 'lucide-react';
import './ProductList.css';

const ProductList = ({ addToShoppingList }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [filters, setFilters] = useState({
    categories: [],
    suppliers: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickView, setShowQuickView] = useState(null);
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load products from JSON
  useEffect(() => {
    setLoading(true);
    fetch("/dental_products.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Nie udało się załadować danych.");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const processedData = data.map((product) => ({
            ...product,
            // Oczyszczanie nazwy produktu
            name: product.name ? product.name.replace(/(N\/A\s(?:szt|op\.)|szt|op\.)/gi, "").trim() : "",
          }));

          setProducts(processedData);
          setFilteredProducts(processedData);
        } else {
          throw new Error("Dane nie są tablicą.");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Get unique categories and suppliers
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean).sort();
  const suppliers = [...new Set(products.map(p => p.supplier))].filter(Boolean).sort();

  // Filter and sort products
  useEffect(() => {
    let result = [...products];

    // Search filter
    if (searchTerm) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter(product => filters.categories.includes(product.category));
    }

    // Supplier filter
    if (filters.suppliers.length > 0) {
      result = result.filter(product => filters.suppliers.includes(product.supplier));
    }

    // Sort
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, searchTerm, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value) 
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const clearFilters = () => {
    setFilters({ categories: [], suppliers: [] });
    setSearchTerm('');
  };

  const addToShoppingListHandler = (product) => {
    if (addToShoppingList) {
      addToShoppingList({ ...product, addedAutomatically: product.stock < 5 });
    }
    setNotification(`Dodano ${product.name} do listy zakupów!`);
    setTimeout(() => setNotification(''), 3000);
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const ProductCard = ({ product }) => {
    return (
      <div className="product-card">
        <div className="product-card-header">
          <Package className="product-icon" />
          <div className="product-card-actions">
            <button
              onClick={() => setShowQuickView(product)}
              className="quick-view-btn"
              title="Podgląd"
            >
              <Eye className="icon" />
            </button>
          </div>
        </div>
        
        <div className="product-card-body">
          <h3 className="product-title">
            {product.name}
          </h3>
          
          <div className="product-details">
            <div className="detail-item">
              <Building2 className="detail-icon" />
              <span className="detail-text">{product.supplier}</span>
            </div>
            <div className="detail-item">
              <Tag className="detail-icon" />
              <span className="detail-text">{product.category}</span>
            </div>
          </div>

          <button
            onClick={() => addToShoppingListHandler(product)}
            className="add-to-list-btn"
          >
            <Plus className="icon" />
            Dodaj do listy
          </button>
        </div>
      </div>
    );
  };

  const TableRow = ({ product }) => {
    return (
      <tr className="table-row">
        <td className="table-cell table-cell-product">
          <div className="table-product-info">
            <div className="table-product-icon">
              <Package className="icon" />
            </div>
            <div className="table-product-details">
              <div className="table-product-name">{product.name}</div>
            </div>
          </div>
        </td>
        <td className="table-cell">{product.supplier}</td>
        <td className="table-cell">{product.category}</td>
        <td className="table-cell table-cell-actions">
          <div className="table-actions">
            <button
              onClick={() => setShowQuickView(product)}
              className="table-action-btn"
              title="Podgląd"
            >
              <Eye className="icon" />
            </button>
            <button
              onClick={() => addToShoppingListHandler(product)}
              className="add-to-list-btn table-add-btn"
            >
              <Plus className="icon" />
              Dodaj
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Ładowanie produktów...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-title">Błąd ładowania danych</div>
          <p className="error-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <div className="container">
        {/* Header */}
        <div className="header">
          <h1 className="main-title">Baza Produktów Gabinetu</h1>
          <p className="subtitle">Wszystkie produkty używane w gabinecie dentystycznym</p>
        </div>

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="filters-top">
            {/* Search */}
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Szukaj produktów..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Controls */}
            <div className="controls">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`filters-toggle ${showFilters ? 'active' : ''}`}
              >
                <SlidersHorizontal className="icon" />
                Filtry
              </button>

              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="items-per-page-select"
              >
                <option value={12}>12 na stronę</option>
                <option value={24}>24 na stronę</option>
                <option value={48}>48 na stronę</option>
                <option value={96}>96 na stronę</option>
              </select>

              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  title="Widok kafelków"
                >
                  <Grid3X3 className="icon" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                  title="Widok tabeli"
                >
                  <List className="icon" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filters-grid">
                <div className="filter-group">
                  <label className="filter-label">Kategorie</label>
                  <div className="filter-list">
                    {categories.map(category => (
                      <label key={category} className="filter-item">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category)}
                          onChange={() => handleFilterChange('categories', category)}
                          className="filter-checkbox"
                        />
                        <span className="filter-text">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Dostawcy</label>
                  <div className="filter-list">
                    {suppliers.map(supplier => (
                      <label key={supplier} className="filter-item">
                        <input
                          type="checkbox"
                          checked={filters.suppliers.includes(supplier)}
                          onChange={() => handleFilterChange('suppliers', supplier)}
                          className="filter-checkbox"
                        />
                        <span className="filter-text">{supplier}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-actions">
                  <button
                    onClick={clearFilters}
                    className="clear-filters-btn"
                  >
                    Wyczyść wszystkie filtry
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="results-info">
          <div className="results-count">
            Znaleziono <span className="count-number">{filteredProducts.length}</span> {
              filteredProducts.length === 1 ? 'produkt' : 
              filteredProducts.length < 5 ? 'produkty' : 'produktów'
            }
          </div>
          
          <div className="sort-controls">
            <span className="sort-label">Sortuj według:</span>
            <select
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                setSortConfig({ key, direction });
              }}
              className="sort-select"
            >
              <option value="name-asc">Nazwa A-Z</option>
              <option value="name-desc">Nazwa Z-A</option>
              <option value="supplier-asc">Dostawca A-Z</option>
              <option value="supplier-desc">Dostawca Z-A</option>
              <option value="category-asc">Kategoria A-Z</option>
              <option value="category-desc">Kategoria Z-A</option>
            </select>
          </div>
        </div>

        {/* Products Display */}
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Package className="empty-icon" />
            <h3 className="empty-title">Brak produktów</h3>
            <p className="empty-text">Nie znaleziono produktów spełniających kryteria wyszukiwania.</p>
            {(searchTerm || filters.categories.length > 0 || filters.suppliers.length > 0) && (
              <button
                onClick={clearFilters}
                className="empty-action"
              >
                Wyczyść filtry
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="products-grid">
            {currentProducts.map(product => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        ) : (
          <div className="table-container">
            <table className="products-table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">
                    <button onClick={() => handleSort('name')} className="sort-header">
                      Nazwa produktu
                      {sortConfig.key === 'name' && (
                        <span className="sort-indicator">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="table-header-cell">
                    <button onClick={() => handleSort('supplier')} className="sort-header">
                      Dostawca
                      {sortConfig.key === 'supplier' && (
                        <span className="sort-indicator">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="table-header-cell">
                    <button onClick={() => handleSort('category')} className="sort-header">
                      Kategoria
                      {sortConfig.key === 'category' && (
                        <span className="sort-indicator">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="table-header-cell">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map(product => (
                  <TableRow key={product.product_id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ←
            </button>
            
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              →
            </button>
          </div>
        )}

        {/* Quick View Modal */}
        {showQuickView && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title">Szczegóły produktu</h2>
                  <button
                    onClick={() => setShowQuickView(null)}
                    className="modal-close"
                  >
                    <X className="icon" />
                  </button>
                </div>
                
                <div className="modal-body">
                  <div className="modal-image">
                    <Package className="modal-icon" />
                  </div>
                  
                  <div className="modal-details">
                    <h3 className="modal-product-name">{showQuickView.name}</h3>
                    
                    <div className="modal-info">
                      <div className="modal-info-item">
                        <Building2 className="modal-info-icon" />
                        <div>
                          <span className="modal-info-label">Dostawca:</span>
                          <p className="modal-info-value">{showQuickView.supplier}</p>
                        </div>
                      </div>
                      <div className="modal-info-item">
                        <Tag className="modal-info-icon" />
                        <div>
                          <span className="modal-info-label">Kategoria:</span>
                          <p className="modal-info-value">{showQuickView.category}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="modal-actions">
                      <button
                        onClick={() => {
                          addToShoppingListHandler(showQuickView);
                          setShowQuickView(null);
                        }}
                        className="modal-add-btn"
                      >
                        <Plus className="icon" />
                        Dodaj do listy zakupów
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className="notification">
            <div className="notification-indicator"></div>
            {notification}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;